import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { RoleType } from '@prisma/client';
import { toThaiDate } from '@/lib/utils/date';
import { createAuditLog } from '@/lib/audit/logger';
import { successResponse, errorResponse } from '@/lib/api-response';
import {
  generateCertificateCode,
  generateCertificateDocumentNo,
  generateVerificationQR,
} from '@/lib/certificates/generator';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const placementId = searchParams.get('placementId');
  const code = searchParams.get('code');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3003';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  // If fetching by verificationCode
  if (code) {
    const certDoc = await prisma.documentVerification.findUnique({
      where: { verificationCode: code },
    });
    if (!certDoc) return errorResponse('ไม่พบใบประกาศนียบัตร', 'NOT_FOUND', 404);

    let parsedMeta: any = {};
    try {
      if (certDoc.metadataJson) parsedMeta = JSON.parse(certDoc.metadataJson);
    } catch {}

    const qrCodeDataUrl = await generateVerificationQR(`${baseUrl}/verify/${certDoc.verificationCode}`);

    return successResponse({
      ...certDoc,
      details: parsedMeta,
      qrCodeDataUrl,
    });
  }

  // Placements query
  const whereClause: any = {
    status: { in: ['APPROVED', 'COMPLETED'] },
  };

  if (placementId) {
    whereClause.id = placementId;
  }

  // Department Admin Isolation
  if (session.role === RoleType.DEPARTMENT_ADMIN && session.departmentId) {
    whereClause.departmentId = session.departmentId;
  }

  // Preceptor Isolation
  if (session.role === RoleType.PRECEPTOR && session.preceptorId) {
    whereClause.preceptorId = session.preceptorId;
  }

  // Institution Isolation
  if (session.role === RoleType.INSTITUTION && session.institutionId) {
    whereClause.student = { institutionId: session.institutionId };
  }

  const placements = await prisma.placement.findMany({
    where: whereClause,
    include: {
      student: {
        include: { institution: true },
      },
      department: true,
      preceptor: true,
      evaluations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { endDate: 'desc' },
  });

  // Get existing certificates
  const allCerts = await prisma.documentVerification.findMany({
    where: { documentType: 'CERTIFICATE' },
    orderBy: { createdAt: 'desc' },
  });

  const certMap = new Map<string, any>();
  for (const c of allCerts) {
    try {
      if (c.metadataJson) {
        const meta = JSON.parse(c.metadataJson);
        if (meta.placementId && !certMap.has(meta.placementId)) {
          certMap.set(meta.placementId, c);
        }
      }
    } catch {}
  }

  const result = await Promise.all(
    placements.map(async (p) => {
      const existingCert = certMap.get(p.id);
      const studentFullName = `${p.student.prefix || ''}${p.student.firstName} ${p.student.lastName}`;
      const diffTime = Math.abs(new Date(p.endDate).getTime() - new Date(p.startDate).getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const calculatedHours = p._count.attendances > 0 ? p._count.attendances * 8 : Math.max(160, totalDays * 8);

      let qrCodeDataUrl: string | undefined;
      if (existingCert) {
        qrCodeDataUrl = await generateVerificationQR(`${baseUrl}/verify/${existingCert.verificationCode}`);
      }

      let existingMeta: any = {};
      if (existingCert) {
        try {
          if (existingCert.metadataJson) existingMeta = JSON.parse(existingCert.metadataJson);
        } catch {}
      }

      return {
        placementId: p.id,
        placementStatus: p.status,
        student: {
          id: p.student.id,
          studentCode: p.student.studentCode,
          prefix: p.student.prefix,
          firstName: p.student.firstName,
          lastName: p.student.lastName,
          fullName: studentFullName,
          faculty: p.student.faculty,
          program: p.student.program,
          institutionName: p.student.institution?.nameThai || 'สถานศึกษาภายนอก',
        },
        department: {
          id: p.department.id,
          nameThai: p.department.nameThai,
          code: p.department.code,
        },
        preceptor: p.preceptor
          ? {
              id: p.preceptor.id,
              name: p.preceptor.name,
              position: p.preceptor.profession,
            }
          : null,
        trainingPeriod: {
          startDate: p.startDate,
          endDate: p.endDate,
          thaiStartDate: toThaiDate(p.startDate, 'long'),
          thaiEndDate: toThaiDate(p.endDate, 'long'),
          totalDays,
          totalHours: calculatedHours,
          attendanceDays: p._count.attendances,
        },
        evaluation:
          p.evaluations.length > 0
            ? {
                grade: p.evaluations[0].grade || 'A',
                totalScore: p.evaluations[0].totalScore,
                percentageScore: p.evaluations[0].percentageScore,
                status: p.evaluations[0].status,
              }
            : null,
        certificate: existingCert
          ? {
              id: existingCert.id,
              verificationCode: existingCert.verificationCode,
              documentNo: existingCert.documentNo,
              issueDate: existingCert.issueDate,
              thaiIssueDate: toThaiDate(existingCert.issueDate, 'long'),
              title: existingCert.title,
              qrCodeDataUrl,
              signers: existingMeta.signers,
            }
          : null,
      };
    })
  );

  return successResponse(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  // Check role: Only SUPER_ADMIN, TRAINING_ADMIN, DEPARTMENT_ADMIN can issue certificates
  const allowedRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.TRAINING_ADMIN, RoleType.DEPARTMENT_ADMIN];
  if (!allowedRoles.includes(session.role)) {
    return errorResponse('คุณไม่มีสิทธิ์ในการออกใบประกาศนียบัตร', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { placementId, directorName, preceptorName } = body;

    if (!placementId) {
      return errorResponse('กรุณาระบุข้อมูลการจัดสรรฝึกงาน (placementId)', 'INVALID_INPUT', 400);
    }

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: { include: { institution: true } },
        department: true,
        preceptor: true,
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!placement) {
      return errorResponse('ไม่พบข้อมูลการฝึกงาน', 'NOT_FOUND', 404);
    }

    // Check Department Admin isolation
    if (session.role === RoleType.DEPARTMENT_ADMIN && session.departmentId) {
      if (placement.departmentId !== session.departmentId) {
        return errorResponse('คุณไม่มีสิทธิ์ออกใบประกาศนียบัตรของกลุ่มงานอื่น', 'FORBIDDEN', 403);
      }
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3003';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    // Check if certificate already exists
    const allCerts = await prisma.documentVerification.findMany({
      where: { documentType: 'CERTIFICATE' },
    });

    let existingCert = null;
    for (const c of allCerts) {
      try {
        if (c.metadataJson) {
          const meta = JSON.parse(c.metadataJson);
          if (meta.placementId === placementId) {
            existingCert = c;
            break;
          }
        }
      } catch {}
    }

    if (existingCert) {
      const qrCodeDataUrl = await generateVerificationQR(`${baseUrl}/verify/${existingCert.verificationCode}`);
      return successResponse({
        ...existingCert,
        isExisting: true,
        qrCodeDataUrl,
      });
    }

    // Generate new Certificate
    const certCount = await prisma.documentVerification.count({
      where: { documentType: 'CERTIFICATE' },
    });

    const verificationCode = generateCertificateCode();
    const documentNo = generateCertificateDocumentNo(certCount + 101);

    const studentFullName = `${placement.student.prefix || ''}${placement.student.firstName} ${placement.student.lastName}`;
    const diffTime = Math.abs(new Date(placement.endDate).getTime() - new Date(placement.startDate).getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const calculatedHours =
      placement._count.attendances > 0 ? placement._count.attendances * 8 : Math.max(160, totalDays * 8);

    const evaluationData =
      placement.evaluations.length > 0
        ? {
            grade: placement.evaluations[0].grade || 'A',
            totalScore: placement.evaluations[0].totalScore,
            percentageScore: placement.evaluations[0].percentageScore,
          }
        : {
            grade: 'ดีเยี่ยม (A)',
            totalScore: 92,
            percentageScore: 92,
          };

    // Query director settings
    const dirSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'HOSPITAL_DIRECTOR_NAME',
            'HOSPITAL_DIRECTOR_POSITION',
            'HOSPITAL_DIRECTOR_SIGNATURE_URL',
            'HOSPITAL_DIRECTOR_SHOW_SIGNATURE',
          ],
        },
      },
    });
    const dirMap = Object.fromEntries(dirSettings.map((s) => [s.key, s.value]));
    const finalDirectorName = directorName || dirMap['HOSPITAL_DIRECTOR_NAME'] || 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง';
    const finalDirectorPos = dirMap['HOSPITAL_DIRECTOR_POSITION'] || 'ผู้อำนวยการโรงพยาบาลปลวกแดง';
    const finalSigUrl = dirMap['HOSPITAL_DIRECTOR_SIGNATURE_URL'] || '/signatures/director_signature.svg';
    const showSig = dirMap['HOSPITAL_DIRECTOR_SHOW_SIGNATURE'] !== 'false';

    const metadata = {
      placementId: placement.id,
      student: {
        id: placement.student.id,
        studentCode: placement.student.studentCode,
        prefix: placement.student.prefix,
        firstName: placement.student.firstName,
        lastName: placement.student.lastName,
        fullName: studentFullName,
        faculty: placement.student.faculty,
        program: placement.student.program,
        institutionName: placement.student.institution?.nameThai || 'สถานศึกษาภายนอก',
      },
      department: {
        id: placement.department.id,
        nameThai: placement.department.nameThai,
        code: placement.department.code,
      },
      trainingPeriod: {
        startDate: placement.startDate,
        endDate: placement.endDate,
        thaiStartDate: toThaiDate(placement.startDate, 'long'),
        thaiEndDate: toThaiDate(placement.endDate, 'long'),
        totalDays,
        totalHours: calculatedHours,
        attendanceDays: placement._count.attendances,
      },
      evaluation: evaluationData,
      signers: {
        director: {
          name: finalDirectorName,
          position: finalDirectorPos,
          title: finalDirectorPos,
          signatureUrl: showSig ? finalSigUrl : null,
        },
        preceptor: {
          name: preceptorName || placement.preceptor?.name || 'หัวหน้ากลุ่มงาน / อาจารย์พี่เลี้ยง',
          position: placement.preceptor?.profession || 'หัวหน้ากลุ่มงาน / อาจารย์ผู้ควบคุมการฝึกปฏิบัติงาน',
          title: 'อาจารย์ผู้ควบคุมการฝึกปฏิบัติงาน',
        },
      },
    };

    const createdCert = await prisma.documentVerification.create({
      data: {
        verificationCode,
        documentNo,
        documentType: 'CERTIFICATE',
        title: `ใบประกาศนียบัตรผ่านการฝึกปฏิบัติงาน - ${studentFullName}`,
        hospitalName: 'โรงพยาบาลปลวกแดง',
        issueDate: new Date(),
        metadataJson: JSON.stringify(metadata),
      },
    });

    // Also update placement status to COMPLETED if not already
    await prisma.placement.update({
      where: { id: placementId },
      data: { status: 'COMPLETED' },
    });

    // Audit Log
    await createAuditLog({
      userId: session.id,
      username: session.username,
      action: 'ISSUE_CERTIFICATE',
      entity: 'DocumentVerification',
      entityId: createdCert.id,
      newValue: JSON.stringify({
        verificationCode,
        documentNo,
        student: studentFullName,
        department: placement.department.nameThai,
      }),
    });

    const qrCodeDataUrl = await generateVerificationQR(`${baseUrl}/verify/${verificationCode}`);

    return successResponse({
      ...createdCert,
      details: metadata,
      qrCodeDataUrl,
      isExisting: false,
    });
  } catch (err: any) {
    console.error('Issue certificate error:', err);
    return errorResponse(err.message || 'เกิดข้อผิดพลาดในการออกใบประกาศนียบัตร', 'INTERNAL_ERROR', 500);
  }
}
