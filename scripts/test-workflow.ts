import { PrismaClient, RequestStatus, QuotaStatus, PlacementStatus } from '@prisma/client';
import { approvePlacementsWithTransaction } from '../src/lib/quota/engine';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting PDHSCHOOL Automated Critical Workflow Tests...\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Database connectivity
  try {
    const count = await prisma.department.count();
    if (count >= 16) {
      console.log(`✅ TEST 1 PASSED: Database connected. Found ${count} hospital departments.`);
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected >= 16 departments, got ${count}`);
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 1 FAILED:', e);
    failed++;
  }

  // TEST 2: Quota & Overbooking Prevention Transaction
  try {
    // Create a temporary quota period with max 2 students
    const tempQuota = await prisma.quotaPeriod.create({
      data: {
        departmentId: (await prisma.department.findFirstOrThrow()).id,
        academicYear: 2569,
        term: 'TEST',
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-12-31'),
        maxStudents: 2,
        status: QuotaStatus.AVAILABLE,
        notes: 'Temporary test quota',
      },
    });

    // Create a test request with 3 students
    const inst = await prisma.institution.findFirstOrThrow();
    const testReq = await prisma.trainingRequest.create({
      data: {
        requestNo: `TEST-REQ-${Date.now()}`,
        institutionId: inst.id,
        departmentId: tempQuota.departmentId,
        requestedStartDate: tempQuota.startDate,
        requestedEndDate: tempQuota.endDate,
        requestedStudents: 3,
        coordinatorName: 'Tester',
        coordinatorPhone: '0812345678',
        coordinatorEmail: 'test@example.com',
        status: RequestStatus.SUBMITTED,
      },
    });

    // Create 3 test students
    const s1 = await prisma.student.create({
      data: {
        studentCode: `T1_${Date.now()}`,
        firstName: 'Test1',
        lastName: 'User',
        institutionId: inst.id,
      },
    });
    const s2 = await prisma.student.create({
      data: {
        studentCode: `T2_${Date.now()}`,
        firstName: 'Test2',
        lastName: 'User',
        institutionId: inst.id,
      },
    });
    const s3 = await prisma.student.create({
      data: {
        studentCode: `T3_${Date.now()}`,
        firstName: 'Test3',
        lastName: 'User',
        institutionId: inst.id,
      },
    });

    // Attempt to approve 3 students into a quota with max 2 (Overbooking attempt)
    let caughtOverbooking = false;
    try {
      await approvePlacementsWithTransaction({
        requestId: testReq.id,
        quotaPeriodId: tempQuota.id,
        approvedStudentIds: [s1.id, s2.id, s3.id],
        approvedBy: 'AutoTest',
      });
    } catch (err: any) {
      if (err.message.includes('QUOTA_FULL')) {
        caughtOverbooking = true;
      }
    }

    if (caughtOverbooking) {
      console.log('✅ TEST 2 PASSED: Overbooking was successfully rejected with QUOTA_FULL inside database transaction.');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: Overbooking was not caught! Placements exceeded quota capacity.');
      failed++;
    }

    // Now test valid approval of 2 students
    const validApproval = await approvePlacementsWithTransaction({
      requestId: testReq.id,
      quotaPeriodId: tempQuota.id,
      approvedStudentIds: [s1.id, s2.id],
      waitlistStudentIds: [s3.id],
      approvedBy: 'AutoTest',
    });

    if (validApproval.success && validApproval.approvedCount === 2 && validApproval.waitlistCount === 1) {
      console.log('✅ TEST 3 PASSED: Partial approval & waitlist succeeded (Approved: 2, Waitlisted: 1).');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: Valid approval failed', validApproval);
      failed++;
    }

    // Clean up test data
    await prisma.placement.deleteMany({ where: { requestId: testReq.id } });
    await prisma.quotaAllocation.deleteMany({ where: { requestId: testReq.id } });
    await prisma.trainingRequestStudent.deleteMany({ where: { requestId: testReq.id } });
    await prisma.trainingRequest.delete({ where: { id: testReq.id } });
    await prisma.student.deleteMany({ where: { id: { in: [s1.id, s2.id, s3.id] } } });
    await prisma.quotaPeriod.delete({ where: { id: tempQuota.id } });
  } catch (e) {
    console.error('❌ TEST 2 & 3 FAILED with error:', e);
    failed++;
  }

  // TEST 4: Document verification lookup
  try {
    const sampleVer = await prisma.documentVerification.findFirst();
    if (sampleVer && sampleVer.verificationCode) {
      console.log(`✅ TEST 4 PASSED: Document verification record active (${sampleVer.verificationCode} - ${sampleVer.documentNo}).`);
      passed++;
    } else {
      console.error('❌ TEST 4 FAILED: No document verification record found.');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 4 FAILED:', e);
    failed++;
  }

  // TEST 5: Audit logs immutable record count
  try {
    const logsCount = await prisma.auditLog.count();
    if (logsCount > 0) {
      console.log(`✅ TEST 5 PASSED: Immutable audit logs recording actions (Found ${logsCount} entries).`);
      passed++;
    } else {
      console.error('❌ TEST 5 FAILED: No audit log records found.');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 5 FAILED:', e);
    failed++;
  }

  console.log('\n==========================================');
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('==========================================\n');

  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => {
    console.error('Fatal error in tests:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
