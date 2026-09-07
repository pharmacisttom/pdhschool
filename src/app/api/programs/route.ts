import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const programs = await prisma.program.findMany({
    orderBy: { programCode: 'asc' },
    include: {
      _count: {
        select: {
          requests: true,
          quotas: true,
        },
      },
    },
  });
  return successResponse(programs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์เพิ่มหลักสูตร', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const {
      programCode,
      programName,
      profession,
      educationLevel = 'ปริญญาตรี',
      active = true,
    } = body;

    if (!programCode || !programName || !profession) {
      return errorResponse('กรุณากรอกข้อมูลหลักสูตรให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const existing = await prisma.program.findUnique({
      where: { programCode: programCode.trim().toUpperCase() },
    });

    if (existing) {
      return errorResponse('รหัสหลักสูตรนี้มีอยู่ในระบบแล้ว', 'DUPLICATE_CODE', 409);
    }

    const prog = await prisma.program.create({
      data: {
        programCode: programCode.trim().toUpperCase(),
        programName: programName.trim(),
        profession: profession.trim(),
        educationLevel: educationLevel.trim(),
        active: Boolean(active),
      },
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'CREATE_PROGRAM',
      entity: 'Program',
      entityId: prog.id,
      newValue: JSON.stringify(prog),
    });

    return successResponse(prog, 201);
  } catch (error: any) {
    console.error('Error creating program:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการบันทึกหลักสูตร', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์แก้ไขหลักสูตร', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { id, programCode, programName, profession, educationLevel, active } = body;

    if (!id) {
      return errorResponse('ไม่พบรหัสอ้างอิงหลักสูตร (id)', 'INVALID_INPUT', 400);
    }

    const existing = await prisma.program.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('ไม่พบหลักสูตรที่ต้องการแก้ไข', 'NOT_FOUND', 404);
    }

    // Check if new code conflicts with another program
    if (programCode && programCode.trim().toUpperCase() !== existing.programCode) {
      const duplicate = await prisma.program.findUnique({
        where: { programCode: programCode.trim().toUpperCase() },
      });
      if (duplicate && duplicate.id !== id) {
        return errorResponse('รหัสหลักสูตรนี้ถูกใช้งานแล้ว', 'DUPLICATE_CODE', 409);
      }
    }

    const updateData: any = {};
    if (programCode !== undefined) updateData.programCode = programCode.trim().toUpperCase();
    if (programName !== undefined) updateData.programName = programName.trim();
    if (profession !== undefined) updateData.profession = profession.trim();
    if (educationLevel !== undefined) updateData.educationLevel = educationLevel.trim();
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await prisma.program.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'UPDATE_PROGRAM',
      entity: 'Program',
      entityId: updated.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error('Error updating program:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการแก้ไขหลักสูตร', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !['SUPER_ADMIN', 'TRAINING_ADMIN'].includes(session.role)) {
    return errorResponse('ไม่มีสิทธิ์ลบหลักสูตร', 'FORBIDDEN', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ไม่พบรหัสอ้างอิงหลักสูตร (id)', 'INVALID_INPUT', 400);
    }

    const existing = await prisma.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            requests: true,
            quotas: true,
          },
        },
      },
    });

    if (!existing) {
      return errorResponse('ไม่พบหลักสูตรที่ต้องการลบ', 'NOT_FOUND', 404);
    }

    // If related records exist, soft delete / set active = false
    if (existing._count.requests > 0 || existing._count.quotas > 0) {
      const deactivated = await prisma.program.update({
        where: { id },
        data: { active: false },
      });

      await createAuditLog({
        userId: session.id,
        username: session.username,
        action: 'DEACTIVATE_PROGRAM',
        entity: 'Program',
        entityId: id,
        newValue: JSON.stringify(deactivated),
      });

      return successResponse({
        ...deactivated,
        action: 'DEACTIVATED',
        message: 'หลักสูตรมีประวัติคำขอฝึกงาน/โควต้าที่เกี่ยวข้อง จึงได้ปรับสถานะเป็น "ปิดรับฝึก" แทนการลบข้อมูลถาวร',
      });
    }

    // Otherwise permanently delete
    await prisma.program.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'DELETE_PROGRAM',
      entity: 'Program',
      entityId: id,
      oldValue: JSON.stringify(existing),
    });

    return successResponse({
      id,
      action: 'DELETED',
      message: 'ลบหลักสูตรออกจากระบบเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error deleting program:', error);
    return errorResponse(error.message || 'เกิดข้อผิดพลาดในการลบหลักสูตร', 'INTERNAL_ERROR', 500);
  }
}
