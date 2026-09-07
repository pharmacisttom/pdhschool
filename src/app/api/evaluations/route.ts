import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { canEvaluate } from '@/lib/auth/rbac';
import { dispatchN8nWebhook } from '@/lib/webhooks/dispatcher';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const placementId = searchParams.get('placementId');

  const whereClause: any = {};
  if (placementId) whereClause.placementId = placementId;

  const evaluations = await prisma.evaluation.findMany({
    where: whereClause,
    include: {
      placement: {
        include: {
          student: { include: { institution: true } },
          department: true,
        },
      },
      preceptor: true,
      scores: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(evaluations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return errorResponse('กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED', 401);
  if (!canEvaluate(session)) return errorResponse('ไม่มีสิทธิ์ทำการประเมินผล', 'FORBIDDEN', 403);

  try {
    const body = await req.json();
    const {
      placementId,
      preceptorId,
      scores = [], // Array of { category, criterionName, maxScore, score, comment }
      qualitativeFeedback,
    } = body;

    if (!placementId || scores.length === 0) {
      return errorResponse('กรุณาระบุข้อมูลการประเมินและคะแนนให้ครบถ้วน', 'INVALID_INPUT', 400);
    }

    const totalScore = scores.reduce((sum: number, s: any) => sum + Number(s.score || 0), 0);
    const maxPossibleScore = scores.reduce((sum: number, s: any) => sum + Number(s.maxScore || 10), 0);
    const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    let grade = 'F';
    if (percentageScore >= 80) grade = 'A';
    else if (percentageScore >= 75) grade = 'B+';
    else if (percentageScore >= 70) grade = 'B';
    else if (percentageScore >= 65) grade = 'C+';
    else if (percentageScore >= 60) grade = 'C';
    else if (percentageScore >= 55) grade = 'D+';
    else if (percentageScore >= 50) grade = 'D';

    const actualPreceptorId = session.preceptorId || preceptorId;
    if (!actualPreceptorId) {
      return errorResponse('กรุณาระบุอาจารย์ผู้ประเมิน', 'MISSING_PRECEPTOR', 400);
    }

    const evaluation = await prisma.$transaction(async (tx) => {
      const evalRecord = await tx.evaluation.create({
        data: {
          placementId,
          preceptorId: actualPreceptorId,
          totalScore,
          maxScore: maxPossibleScore,
          percentageScore: Math.round(percentageScore * 10) / 10,
          grade,
          qualitativeFeedback,
          status: 'SUBMITTED',
        },
      });

      for (const s of scores) {
        await tx.evaluationScore.create({
          data: {
            evaluationId: evalRecord.id,
            category: s.category,
            criterionName: s.criterionName,
            maxScore: Number(s.maxScore || 10),
            score: Number(s.score || 0),
            comment: s.comment || null,
          },
        });
      }

      return evalRecord;
    });

    await dispatchN8nWebhook('evaluation.pending', {
      evaluationId: evaluation.id,
      placementId,
      totalScore,
      percentageScore,
      grade,
    });

    return successResponse(evaluation, 201);
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return errorResponse('เกิดข้อผิดพลาดในการบันทึกการประเมินผล', 'INTERNAL_ERROR', 500);
  }
}
