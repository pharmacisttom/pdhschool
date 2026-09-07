import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canApproveRequests } from '@/lib/auth/rbac';
import { approvePlacementsWithTransaction } from '@/lib/quota/engine';
import { dispatchN8nWebhook } from '@/lib/webhooks/dispatcher';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);
  if (!canApproveRequests(session)) return errorResponse('ไม่มีสิทธิ์อนุมัติคำขอฝึกงาน', 'FORBIDDEN', 403);

  const { id: requestId } = await context.params;

  try {
    const body = await req.json();
    const { quotaPeriodId, approvedStudentIds, waitlistStudentIds = [], notes } = body;

    if (!quotaPeriodId || !approvedStudentIds || !Array.isArray(approvedStudentIds) || approvedStudentIds.length === 0) {
      return errorResponse('กรุณาระบุช่วงเวลาโควต้าและเลือกนักศึกษาที่ต้องการอนุมัติ', 'INVALID_INPUT', 400);
    }

    const result = await approvePlacementsWithTransaction({
      requestId,
      quotaPeriodId,
      approvedStudentIds,
      waitlistStudentIds,
      approvedBy: session.name,
      notes,
    });

    // Fire webhook
    await dispatchN8nWebhook('training_request.approved', {
      requestId,
      approvedCount: result.approvedCount,
      waitlistCount: result.waitlistCount,
      newStatus: result.newStatus,
    });

    return successResponse(result);
  } catch (error: any) {
    console.error('Approval failed:', error);
    const message = error?.message || 'เกิดข้อผิดพลาดในการอนุมัติคำขอ';
    const isQuotaFull = message.includes('QUOTA_FULL');
    return errorResponse(message, isQuotaFull ? 'QUOTA_FULL' : 'APPROVAL_ERROR', isQuotaFull ? 409 : 500);
  }
}
