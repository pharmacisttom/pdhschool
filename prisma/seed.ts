import { PrismaClient, RoleType, QuotaStatus, RequestStatus, PlacementStatus, InstitutionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PDHSCHOOL Database Seeding...');

  // 1. System Settings
  const defaultSettings = [
    { key: 'HOSPITAL_NAME_TH', value: 'โรงพยาบาลปลวกแดง', description: 'ชื่อโรงพยาบาล (ภาษาไทย)', category: 'BRANDING' },
    { key: 'HOSPITAL_NAME_EN', value: 'Pluakdaeng Hospital', description: 'ชื่อโรงพยาบาล (English)', category: 'BRANDING' },
    { key: 'HOSPITAL_PROVINCE', value: 'ระยอง', description: 'จังหวัดที่ตั้งโรงพยาบาล', category: 'BRANDING' },
    { key: 'HOSPITAL_ADDRESS', value: 'เลขที่ 99 หมู่ 1 ต.ปลวกแดง อ.ปลวกแดง จ.ระยอง 21140', description: 'ที่อยู่ทางการ', category: 'BRANDING' },
    { key: 'HOSPITAL_PHONE', value: '038-659-123', description: 'เบอร์โทรศัพท์ส่วนกลาง', category: 'BRANDING' },
    { key: 'CURRENT_FISCAL_YEAR', value: '2569', description: 'ปีงบประมาณปัจจุบัน (พ.ศ.)', category: 'GENERAL' },
    { key: 'QUOTA_WARNING_PERCENT', value: '30', description: 'เปอร์เซ็นต์แจ้งเตือนโควต้าใกล้เต็ม (%)', category: 'QUOTA' },
    { key: 'MAX_UPLOAD_SIZE_MB', value: '15', description: 'ขนาดไฟล์อัปโหลดสูงสุด (MB)', category: 'SECURITY' },
    { key: 'TRAINING_COORDINATOR_NAME', value: 'ภก. วิศรุต ภักดี (ผู้ประสานงานแหล่งฝึกกลาง)', description: 'ผู้รับผิดชอบงานฝึกอบรมกลาง', category: 'CONTACT' },
    { key: 'TRAINING_COORDINATOR_EMAIL', value: 'training@pluakdaenghospital.go.th', description: 'อีเมลประสานงานแหล่งฝึก', category: 'CONTACT' },
    { key: 'MAINTENANCE_MODE', value: 'false', description: 'โหมดปิดปรับปรุงระบบ', category: 'SYSTEM' }
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description, category: s.category },
      create: s
    });
  }
  console.log('✅ System Settings seeded');

  // 2. Hospital Departments (16 Departments)
  const departmentsData = [
    { code: 'DEP-PHARM', nameThai: 'กลุ่มงานเภสัชกรรม', nameEnglish: 'Pharmacy Department', defaultQuota: 6, contactPerson: 'ภก. วิศรุต ภักดี', phone: '038-659123 ต่อ 101', email: 'pharmacy@pluakdaenghospital.go.th' },
    { code: 'DEP-NURS', nameThai: 'กลุ่มงานการพยาบาล', nameEnglish: 'Nursing Department', defaultQuota: 20, contactPerson: 'พว. นงลักษณ์ รักษ์สุข', phone: '038-659123 ต่อ 201', email: 'nursing@pluakdaenghospital.go.th' },
    { code: 'DEP-ER', nameThai: 'ห้องอุบัติเหตุและฉุกเฉิน (ER)', nameEnglish: 'Emergency Department', defaultQuota: 6, contactPerson: 'พว. ณัฐพงษ์ สว่างจิต', phone: '038-659123 ต่อ 205', email: 'er@pluakdaenghospital.go.th' },
    { code: 'DEP-OPD', nameThai: 'แผนกผู้ป่วยนอก (OPD)', nameEnglish: 'Outpatient Department', defaultQuota: 8, contactPerson: 'พว. อารียา ชื่นใจ', phone: '038-659123 ต่อ 202', email: 'opd@pluakdaenghospital.go.th' },
    { code: 'DEP-IPD', nameThai: 'แผนกผู้ป่วยใน (IPD)', nameEnglish: 'Inpatient Department', defaultQuota: 10, contactPerson: 'พว. จุฬารัตน์ สายธาร', phone: '038-659123 ต่อ 203', email: 'ipd@pluakdaenghospital.go.th' },
    { code: 'DEP-LAB', nameThai: 'กลุ่มงานเทคนิคการแพทย์ (ห้องปฏิบัติการ)', nameEnglish: 'Medical Laboratory', defaultQuota: 6, contactPerson: 'ทนพ. สมชาย เก่งกาจ', phone: '038-659123 ต่อ 301', email: 'lab@pluakdaenghospital.go.th' },
    { code: 'DEP-XRAY', nameThai: 'กลุ่มงานรังสีวิทยา', nameEnglish: 'Radiology Department', defaultQuota: 4, contactPerson: 'นายกิตติศักดิ์ ฉายแสง', phone: '038-659123 ต่อ 305', email: 'xray@pluakdaenghospital.go.th' },
    { code: 'DEP-PT', nameThai: 'กลุ่มงานกายภาพบำบัด', nameEnglish: 'Physical Therapy Department', defaultQuota: 6, contactPerson: 'กภ. สุภาวดี สดใส', phone: '038-659123 ต่อ 401', email: 'pt@pluakdaenghospital.go.th' },
    { code: 'DEP-DENT', nameThai: 'กลุ่มงานทันตกรรม', nameEnglish: 'Dental Department', defaultQuota: 4, contactPerson: 'ทพญ. ปิยะนุช สุขเกษม', phone: '038-659123 ต่อ 501', email: 'dent@pluakdaenghospital.go.th' },
    { code: 'DEP-SOCMED', nameThai: 'กลุ่มงานเวชกรรมสังคม', nameEnglish: 'Social Medicine Department', defaultQuota: 8, contactPerson: 'นพ. รณภพ ศรีสมุทร', phone: '038-659123 ต่อ 601', email: 'socmed@pluakdaenghospital.go.th' },
    { code: 'DEP-PRIMARY', nameThai: 'กลุ่มงานบริการด้านปฐมภูมิและองค์รวม', nameEnglish: 'Primary Care Department', defaultQuota: 8, contactPerson: 'พว. วันเพ็ญ งามยิ่ง', phone: '038-659123 ต่อ 605', email: 'primary@pluakdaenghospital.go.th' },
    { code: 'DEP-FIN', nameThai: 'กลุ่มงานการเงินและบัญชี', nameEnglish: 'Finance & Accounting', defaultQuota: 4, contactPerson: 'นางวิไล พูลผล', phone: '038-659123 ต่อ 701', email: 'finance@pluakdaenghospital.go.th' },
    { code: 'DEP-HR', nameThai: 'กลุ่มงานทรัพยากรบุคคล', nameEnglish: 'Human Resources', defaultQuota: 4, contactPerson: 'นายธีระวัฒน์ มั่นคง', phone: '038-659123 ต่อ 705', email: 'hr@pluakdaenghospital.go.th' },
    { code: 'DEP-IT', nameThai: 'ศูนย์เทคโนโลยีสารสนเทศ', nameEnglish: 'IT & Digital Health Center', defaultQuota: 6, contactPerson: 'นายวีระเกียรติ พัฒนกิจ', phone: '038-659123 ต่อ 801', email: 'it@pluakdaenghospital.go.th' },
    { code: 'DEP-GEN', nameThai: 'กลุ่มงานบริหารทั่วไป', nameEnglish: 'General Administration', defaultQuota: 4, contactPerson: 'นายประสิทธิ์ รัตนชัย', phone: '038-659123 ต่อ 805', email: 'admin@pluakdaenghospital.go.th' },
    { code: 'DEP-PCU', nameThai: 'รพ.สต. ในเครือข่ายอำเภอปลวกแดง', nameEnglish: 'Network Primary Care Units', defaultQuota: 12, contactPerson: 'นางสมจิตต์ สวนสุข', phone: '038-659123 ต่อ 610', email: 'pcu@pluakdaenghospital.go.th' }
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    const created = await prisma.department.upsert({
      where: { code: d.code },
      update: { nameThai: d.nameThai, nameEnglish: d.nameEnglish, defaultQuota: d.defaultQuota, contactPerson: d.contactPerson, phone: d.phone, email: d.email },
      create: d
    });
    deptMap.set(d.code, created.id);
  }
  console.log('✅ 16 Hospital Departments seeded');

  // 3. Training Programs / Professions
  const programsData = [
    { programCode: 'PROG-MD', programName: 'แพทยศาสตร์', profession: 'แพทย์', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-NURSE', programName: 'พยาบาลศาสตร์', profession: 'พยาบาลวิชาชีพ', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-PHARM', programName: 'เภสัชศาสตร์ (การบริบาลทางเภสัชกรรม)', profession: 'เภสัชกร', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-MEDTECH', programName: 'เทคนิคการแพทย์', profession: 'นักเทคนิคการแพทย์', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-PUBHEALTH', programName: 'สาธารณสุขศาสตร์', profession: 'นักวิชาการสาธารณสุข', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-PT', programName: 'กายภาพบำบัด', profession: 'นักกายภาพบำบัด', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-RADTECH', programName: 'รังสีเทคนิค', profession: 'นักรังสีการแพทย์', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-DENT', programName: 'ทันตแพทยศาสตร์', profession: 'ทันตแพทย์', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-NA', programName: 'ประกาศนียบัตรผู้ช่วยพยาบาล', profession: 'ผู้ช่วยพยาบาล', educationLevel: 'ประกาศนียบัตร' },
    { programCode: 'PROG-IT', programName: 'เทคโนโลยีสารสนเทศ / วิทยาการคอมพิวเตอร์', profession: 'นักวิชาการคอมพิวเตอร์', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-BA', programName: 'บริหารธุรกิจ / การจัดการโรงพยาบาล', profession: 'นักจัดการงานทั่วไป', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-ACC', programName: 'การบัญชีและการเงิน', profession: 'นักวิชาการเงินและบัญชี', educationLevel: 'ปริญญาตรี' },
    { programCode: 'PROG-VOC', programName: 'อาชีวศึกษา (ปวช./ปวส.) สาขางานธุรการ/ช่าง', profession: 'เจ้าหน้าที่สนับสนุน', educationLevel: 'ปวช./ปวส.' }
  ];

  const progMap = new Map<string, string>();
  for (const p of programsData) {
    const created = await prisma.program.upsert({
      where: { programCode: p.programCode },
      update: { programName: p.programName, profession: p.profession, educationLevel: p.educationLevel },
      create: p
    });
    progMap.set(p.programCode, created.id);
  }
  console.log('✅ 13 Training Programs seeded');

  // 4. Educational Institutions (Demo Partners)
  const institutionsData = [
    {
      code: 'INST-BUU',
      nameThai: 'มหาวิทยาลัยบูรพา',
      nameEnglish: 'Burapha University',
      type: 'มหาวิทยาลัยในกำกับของรัฐ',
      faculty: 'คณะเภสัชศาสตร์ / คณะพยาบาลศาสตร์',
      province: 'ชลบุรี',
      postalCode: '20131',
      coordinatorName: 'ดร. พรทิพย์ สุวรรณโชติ',
      coordinatorPhone: '038-102-222',
      coordinatorEmail: 'pharm_intern@buu.ac.th',
      officialEmail: 'saraban@buu.ac.th',
      status: InstitutionStatus.ACTIVE
    },
    {
      code: 'INST-BCNC',
      nameThai: 'วิทยาลัยพยาบาลบรมราชชนนี ชลบุรี',
      nameEnglish: 'Boromarajonani College of Nursing Chonburi',
      type: 'สถาบันพระบรมราชชนก',
      faculty: 'หลักสูตรพยาบาลศาสตรบัณฑิต',
      province: 'ชลบุรี',
      postalCode: '20000',
      coordinatorName: 'อ. กรกนก รุ่งเรือง',
      coordinatorPhone: '038-282-345',
      coordinatorEmail: 'bcnc_training@bcnc.ac.th',
      officialEmail: 'saraban@bcnc.ac.th',
      status: InstitutionStatus.ACTIVE
    },
    {
      code: 'INST-SCPHC',
      nameThai: 'วิทยาลัยการสาธารณสุขสิรินธร จังหวัดชลบุรี',
      nameEnglish: 'Sirindhorn College of Public Health Chonburi',
      type: 'สถาบันพระบรมราชชนก',
      faculty: 'สาธารณสุขศาสตร์ / เทคนิคการแพทย์',
      province: 'ชลบุรี',
      postalCode: '20130',
      coordinatorName: 'ดร. นภาลัย แจ่มใส',
      coordinatorPhone: '038-381-069',
      coordinatorEmail: 'intern_scphc@scphc.ac.th',
      officialEmail: 'saraban@scphc.ac.th',
      status: InstitutionStatus.ACTIVE
    },
    {
      code: 'INST-MU',
      nameThai: 'มหาวิทยาลัยมหิดล',
      nameEnglish: 'Mahidol University',
      type: 'มหาวิทยาลัยในกำกับของรัฐ',
      faculty: 'คณะเวชศาสตร์เขตร้อน / คณะกายภาพบำบัด',
      province: 'นครปฐม',
      postalCode: '73170',
      coordinatorName: 'ผศ.ดร. นภนต์ จิตเจริญ',
      coordinatorPhone: '02-849-6000',
      coordinatorEmail: 'trainee@mahidol.ac.th',
      officialEmail: 'saraban@mahidol.ac.th',
      status: InstitutionStatus.ACTIVE
    },
    {
      code: 'INST-RYTC',
      nameThai: 'วิทยาลัยเทคนิคระยอง',
      nameEnglish: 'Rayong Technical College',
      type: 'สถาบันอาชีวศึกษา',
      faculty: 'แผนกวิชาเทคโนโลยีสารสนเทศและการจัดการ',
      province: 'ระยอง',
      postalCode: '21000',
      coordinatorName: 'อ. เกียรติศักดิ์ พูลแก้ว',
      coordinatorPhone: '038-611-192',
      coordinatorEmail: 'dve@rayongtech.ac.th',
      officialEmail: 'info@rayongtech.ac.th',
      status: InstitutionStatus.ACTIVE
    }
  ];

  const instMap = new Map<string, string>();
  for (const inst of institutionsData) {
    const created = await prisma.institution.upsert({
      where: { code: inst.code },
      update: { nameThai: inst.nameThai, nameEnglish: inst.nameEnglish, status: inst.status, coordinatorName: inst.coordinatorName, coordinatorEmail: inst.coordinatorEmail },
      create: inst
    });
    instMap.set(inst.code, created.id);
  }
  console.log('✅ Educational Institutions seeded');

  // 5. Preceptors (Clinical Instructors)
  const preceptorsData = [
    { employeeCode: 'EMP-PHARM-01', name: 'ภก. วิศรุต ภักดี', profession: 'เภสัชกรชำนาญการ', deptCode: 'DEP-PHARM', email: 'wisarut.p@pluakdaenghospital.go.th', phone: '081-456-7890' },
    { employeeCode: 'EMP-NURS-01', name: 'พว. นงลักษณ์ รักษ์สุข', profession: 'พยาบาลวิชาชีพชำนาญการพิเศษ', deptCode: 'DEP-NURS', email: 'nonglak.r@pluakdaenghospital.go.th', phone: '089-123-4567' },
    { employeeCode: 'EMP-ER-01', name: 'พว. ณัฐพงษ์ สว่างจิต', profession: 'พยาบาลวิชาชีพชำนาญการ (เวชปฏิบัติฉุกเฉิน)', deptCode: 'DEP-ER', email: 'nattapong.s@pluakdaenghospital.go.th', phone: '086-789-0123' },
    { employeeCode: 'EMP-LAB-01', name: 'ทนพ. สมชาย เก่งกาจ', profession: 'นักเทคนิคการแพทย์ชำนาญการ', deptCode: 'DEP-LAB', email: 'somchai.k@pluakdaenghospital.go.th', phone: '084-567-8901' },
    { employeeCode: 'EMP-PT-01', name: 'กภ. สุภาวดี สดใส', profession: 'นักกายภาพบำบัดชำนาญการ', deptCode: 'DEP-PT', email: 'supawadee.s@pluakdaenghospital.go.th', phone: '082-345-6789' },
    { employeeCode: 'EMP-IT-01', name: 'นายวีระเกียรติ พัฒนกิจ', profession: 'นักวิชาการคอมพิวเตอร์ชำนาญการ', deptCode: 'DEP-IT', email: 'weerakiat.p@pluakdaenghospital.go.th', phone: '085-987-6543' }
  ];

  const preceptorMap = new Map<string, string>();
  for (const pr of preceptorsData) {
    const deptId = deptMap.get(pr.deptCode);
    if (!deptId) continue;
    const created = await prisma.preceptor.upsert({
      where: { employeeCode: pr.employeeCode },
      update: { name: pr.name, profession: pr.profession, departmentId: deptId, email: pr.email, phone: pr.phone },
      create: { employeeCode: pr.employeeCode, name: pr.name, profession: pr.profession, departmentId: deptId, email: pr.email, phone: pr.phone }
    });
    preceptorMap.set(pr.employeeCode, created.id);
  }
  console.log('✅ Preceptors seeded');

  // 6. Users & RBAC
  const salt = await bcrypt.genSalt(10);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@Pdh2569';
  const adminPasswordHash = await bcrypt.hash(adminPassword, salt);
  const commonPasswordHash = await bcrypt.hash('Pdh@123456', salt);

  // 6.1 Super Admin (from env)
  const superAdminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const superAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@pluakdaenghospital.go.th';

  await prisma.user.upsert({
    where: { username: superAdminUsername },
    update: { passwordHash: adminPasswordHash, email: superAdminEmail, name: 'ผู้ดูแลระบบสูงสุด (Super Admin)', role: RoleType.SUPER_ADMIN, active: true },
    create: {
      username: superAdminUsername,
      passwordHash: adminPasswordHash,
      email: superAdminEmail,
      name: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
      role: RoleType.SUPER_ADMIN,
      active: true
    }
  });

  // 6.2 Training Admin (Hospital Training Coordinator)
  await prisma.user.upsert({
    where: { username: 'training.admin' },
    update: { passwordHash: commonPasswordHash, email: 'training.coord@pluakdaenghospital.go.th', name: 'ภก. วิศรุต ภักดี (ผู้ประสานงานแหล่งฝึก)', role: RoleType.TRAINING_ADMIN, active: true },
    create: {
      username: 'training.admin',
      passwordHash: commonPasswordHash,
      email: 'training.coord@pluakdaenghospital.go.th',
      name: 'ภก. วิศรุต ภักดี (ผู้ประสานงานแหล่งฝึก)',
      role: RoleType.TRAINING_ADMIN,
      active: true
    }
  });

  // 6.3 Department Admin (Pharmacy)
  const pharmDeptId = deptMap.get('DEP-PHARM');
  await prisma.user.upsert({
    where: { username: 'dept.pharmacy' },
    update: { passwordHash: commonPasswordHash, email: 'head.pharm@pluakdaenghospital.go.th', name: 'หัวหน้ากลุ่มงานเภสัชกรรม', role: RoleType.DEPARTMENT_ADMIN, departmentId: pharmDeptId, active: true },
    create: {
      username: 'dept.pharmacy',
      passwordHash: commonPasswordHash,
      email: 'head.pharm@pluakdaenghospital.go.th',
      name: 'หัวหน้ากลุ่มงานเภสัชกรรม',
      role: RoleType.DEPARTMENT_ADMIN,
      departmentId: pharmDeptId,
      active: true
    }
  });

  // 6.4 Department Admin (Nursing)
  const nursDeptId = deptMap.get('DEP-NURS');
  await prisma.user.upsert({
    where: { username: 'dept.nursing' },
    update: { passwordHash: commonPasswordHash, email: 'head.nurs@pluakdaenghospital.go.th', name: 'หัวหน้ากลุ่มงานการพยาบาล', role: RoleType.DEPARTMENT_ADMIN, departmentId: nursDeptId, active: true },
    create: {
      username: 'dept.nursing',
      passwordHash: commonPasswordHash,
      email: 'head.nurs@pluakdaenghospital.go.th',
      name: 'หัวหน้ากลุ่มงานการพยาบาล',
      role: RoleType.DEPARTMENT_ADMIN,
      departmentId: nursDeptId,
      active: true
    }
  });

  // 6.5 Preceptor User (Clinical Instructor)
  const preceptorId = preceptorMap.get('EMP-PHARM-01');
  await prisma.user.upsert({
    where: { username: 'preceptor.wisarut' },
    update: { passwordHash: commonPasswordHash, email: 'preceptor.wisarut@pluakdaenghospital.go.th', name: 'ภก. วิศรุต ภักดี (อาจารย์พี่เลี้ยง)', role: RoleType.PRECEPTOR, preceptorId: preceptorId, departmentId: pharmDeptId, active: true },
    create: {
      username: 'preceptor.wisarut',
      passwordHash: commonPasswordHash,
      email: 'preceptor.wisarut@pluakdaenghospital.go.th',
      name: 'ภก. วิศรุต ภักดี (อาจารย์พี่เลี้ยง)',
      role: RoleType.PRECEPTOR,
      preceptorId: preceptorId,
      departmentId: pharmDeptId,
      active: true
    }
  });

  // 6.6 Institution User (Burapha University)
  const buuInstId = instMap.get('INST-BUU');
  await prisma.user.upsert({
    where: { username: 'inst.buu' },
    update: { passwordHash: commonPasswordHash, email: 'buu.coordinator@buu.ac.th', name: 'ผู้ประสานงาน มหาวิทยาลัยบูรพา', role: RoleType.INSTITUTION, institutionId: buuInstId, active: true },
    create: {
      username: 'inst.buu',
      passwordHash: commonPasswordHash,
      email: 'buu.coordinator@buu.ac.th',
      name: 'ผู้ประสานงาน มหาวิทยาลัยบูรพา',
      role: RoleType.INSTITUTION,
      institutionId: buuInstId,
      active: true
    }
  });

  // 6.7 Viewer User
  await prisma.user.upsert({
    where: { username: 'viewer.guest' },
    update: { passwordHash: commonPasswordHash, email: 'viewer@pluakdaenghospital.go.th', name: 'เจ้าหน้าที่ติดตามและประเมินผล (Viewer)', role: RoleType.VIEWER, active: true },
    create: {
      username: 'viewer.guest',
      passwordHash: commonPasswordHash,
      email: 'viewer@pluakdaenghospital.go.th',
      name: 'เจ้าหน้าที่ติดตามและประเมินผล (Viewer)',
      role: RoleType.VIEWER,
      active: true
    }
  });
  console.log('✅ Users with 6 RBAC roles seeded');

  // 7. Quota Periods (Current & Upcoming Batches 2569)
  const quotaPeriodsData = [
    {
      deptCode: 'DEP-PHARM',
      progCode: 'PROG-PHARM',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      maxStudents: 6,
      status: QuotaStatus.AVAILABLE,
      notes: 'ฝึกปฏิบัติงานเภสัชกรรมชุมชนและโรงพยาบาล ผลัดที่ 1'
    },
    {
      deptCode: 'DEP-PHARM',
      progCode: 'PROG-PHARM',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 2/2569',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-30'),
      maxStudents: 6,
      status: QuotaStatus.AVAILABLE,
      notes: 'ฝึกปฏิบัติงานเภสัชกรรมบริบาล ผลัดที่ 2'
    },
    {
      deptCode: 'DEP-NURS',
      progCode: 'PROG-NURSE',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-15'),
      maxStudents: 15,
      status: QuotaStatus.AVAILABLE,
      notes: 'ฝึกปฏิบัติการพยาบาลผู้ใหญ่และผู้สูงอายุ'
    },
    {
      deptCode: 'DEP-ER',
      progCode: 'PROG-NURSE',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      maxStudents: 4,
      status: QuotaStatus.LIMITED,
      notes: 'ฝึกปฏิบัติการพยาบาลอุบัติเหตุและฉุกเฉิน'
    },
    {
      deptCode: 'DEP-LAB',
      progCode: 'PROG-MEDTECH',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      maxStudents: 4,
      status: QuotaStatus.AVAILABLE,
      notes: 'งานตรวจวิเคราะห์โลหิตวิทยาและเคมีคลินิก'
    },
    {
      deptCode: 'DEP-PT',
      progCode: 'PROG-PT',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-11-30'),
      maxStudents: 4,
      status: QuotaStatus.AVAILABLE,
      notes: 'เวชศาสตร์ฟื้นฟูและกายภาพบำบัดผู้ป่วยนอก'
    },
    {
      deptCode: 'DEP-IT',
      progCode: 'PROG-IT',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-12-31'),
      maxStudents: 4,
      status: QuotaStatus.AVAILABLE,
      notes: 'พัฒนาระบบสารสนเทศสุขภาพและ Digital Health'
    },
    {
      deptCode: 'DEP-PCU',
      progCode: 'PROG-PUBHEALTH',
      academicYear: 2569,
      term: 'ภาคเรียนที่ 1/2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      maxStudents: 8,
      status: QuotaStatus.AVAILABLE,
      notes: 'การสาธารณสุขชุมชนและเวชปฏิบัติครอบครัว'
    }
  ];

  const quotaList = [];
  for (const q of quotaPeriodsData) {
    const deptId = deptMap.get(q.deptCode);
    const progId = progMap.get(q.progCode);
    if (!deptId) continue;
    const created = await prisma.quotaPeriod.create({
      data: {
        departmentId: deptId,
        programId: progId,
        academicYear: q.academicYear,
        term: q.term,
        startDate: q.startDate,
        endDate: q.endDate,
        maxStudents: q.maxStudents,
        status: q.status,
        notes: q.notes
      }
    });
    quotaList.push(created);
  }
  console.log(`✅ ${quotaList.length} Quota Periods seeded`);

  // 8. Evaluation Template
  const defaultTemplate = await prisma.evaluationTemplate.create({
    data: {
      name: 'แบบประเมินสมรรถนะมาตรฐานนักศึกษาฝึกปฏิบัติงาน โรงพยาบาลปลวกแดง',
      isDefault: true,
      active: true
    }
  });
  console.log('✅ Standard Evaluation Template seeded');

  // 9. Sample Students (Simulated Demo Trainees)
  if (buuInstId && pharmDeptId) {
    const s1 = await prisma.student.upsert({
      where: { institutionId_studentCode: { institutionId: buuInstId, studentCode: '65140021' } },
      update: {},
      create: {
        studentCode: '65140021',
        prefix: 'นางสาว',
        firstName: 'กานต์รวี',
        lastName: 'วรพงศ์',
        institutionId: buuInstId,
        faculty: 'คณะเภสัชศาสตร์',
        program: 'บริบาลทางเภสัชกรรม',
        yearLevel: 5,
        phone: '089-999-1111',
        email: 'kanrawee.w@buu.ac.th',
        emergencyContact: 'นายสมพร วรพงศ์ (บิดา)',
        emergencyPhone: '081-111-2222',
        nationalIdMasked: '1-2099-XXXXX-12-1',
        departmentId: pharmDeptId,
        placementStatus: PlacementStatus.APPROVED,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-31')
      }
    });

    const s2 = await prisma.student.upsert({
      where: { institutionId_studentCode: { institutionId: buuInstId, studentCode: '65140045' } },
      update: {},
      create: {
        studentCode: '65140045',
        prefix: 'นาย',
        firstName: 'ธนกฤต',
        lastName: 'สุริยาวงศ์',
        institutionId: buuInstId,
        faculty: 'คณะเภสัชศาสตร์',
        program: 'บริบาลทางเภสัชกรรม',
        yearLevel: 5,
        phone: '089-999-2222',
        email: 'thanakrit.s@buu.ac.th',
        emergencyContact: 'นางนารี สุริยาวงศ์ (มารดา)',
        emergencyPhone: '082-222-3333',
        nationalIdMasked: '1-2099-XXXXX-45-6',
        departmentId: pharmDeptId,
        placementStatus: PlacementStatus.APPROVED,
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-31')
      }
    });

    // 10. Sample Approved Request & Placements
    const pharmProgId = progMap.get('PROG-PHARM');
    const existingReq = await prisma.trainingRequest.findUnique({ where: { requestNo: 'TR-2569-000001' } });
    if (!existingReq) {
      const pharmQuota = quotaList[0];
      const request = await prisma.trainingRequest.create({
        data: {
          requestNo: 'TR-2569-000001',
          institutionId: buuInstId,
          departmentId: pharmDeptId,
          programId: pharmProgId,
          educationLevel: 'ปริญญาตรี',
          academicYear: 2569,
          semester: '1',
          requestedStartDate: new Date('2026-10-01'),
          requestedEndDate: new Date('2026-10-31'),
          requestedStudents: 2,
          approvedStudents: 2,
          coordinatorName: 'ดร. พรทิพย์ สุวรรณโชติ',
          coordinatorPhone: '038-102-222',
          coordinatorEmail: 'pharm_intern@buu.ac.th',
          status: RequestStatus.APPROVED,
          notes: 'ขอความอนุเคราะห์ส่งนักศึกษาฝึกปฏิบัติการบริบาลเภสัชกรรมผู้ป่วยนอกและผู้ป่วยใน',
          approvedBy: 'ภก. วิศรุต ภักดี (ผู้ประสานงานแหล่งฝึก)',
          approvedAt: new Date()
        }
      });

      // Link request students
      await prisma.trainingRequestStudent.createMany({
        data: [
          { requestId: request.id, studentId: s1.id, allocatedStatus: PlacementStatus.APPROVED },
          { requestId: request.id, studentId: s2.id, allocatedStatus: PlacementStatus.APPROVED }
        ]
      });

      // Allocate quota
      if (pharmQuota) {
        await prisma.quotaAllocation.create({
          data: {
            quotaPeriodId: pharmQuota.id,
            requestId: request.id,
            studentCount: 2,
            allocatedBy: 'ภก. วิศรุต ภักดี'
          }
        });
      }

      // Create official Placements
      const plc1 = await prisma.placement.create({
        data: {
          studentId: s1.id,
          requestId: request.id,
          departmentId: pharmDeptId,
          quotaPeriodId: pharmQuota ? pharmQuota.id : null,
          preceptorId: preceptorId,
          startDate: new Date('2026-10-01'),
          endDate: new Date('2026-10-31'),
          status: PlacementStatus.APPROVED,
          approvedBy: 'ภก. วิศรุต ภักดี',
          approvedAt: new Date(),
          notes: 'จัดสรรเข้าห้องจ่ายยาผู้ป่วยนอกและหอผู้ป่วยใน'
        }
      });

      const plc2 = await prisma.placement.create({
        data: {
          studentId: s2.id,
          requestId: request.id,
          departmentId: pharmDeptId,
          quotaPeriodId: pharmQuota ? pharmQuota.id : null,
          preceptorId: preceptorId,
          startDate: new Date('2026-10-01'),
          endDate: new Date('2026-10-31'),
          status: PlacementStatus.APPROVED,
          approvedBy: 'ภก. วิศรุต ภักดี',
          approvedAt: new Date(),
          notes: 'จัดสรรเข้าห้องจ่ายยาผู้ป่วยนอกและคลินิกวาร์ฟาริน'
        }
      });

      // Sample Verification Record for Generated Approval Letter
      await prisma.documentVerification.create({
        data: {
          verificationCode: 'VER-PDH-2569-001089',
          documentNo: 'รย 0032.2/ว1089',
          documentType: 'หนังสือตอบรับนักศึกษาเข้าฝึกปฏิบัติงาน',
          hospitalName: 'โรงพยาบาลปลวกแดง',
          title: 'ตอบรับนักศึกษาฝึกปฏิบัติการ คณะเภสัชศาสตร์ มหาวิทยาลัยบูรพา',
          issueDate: new Date(),
          validUntil: new Date('2026-11-30')
        }
      });

      console.log('✅ Demo Request TR-2569-000001, Placements & Document Verification seeded');
    }
  }

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      username: 'SYSTEM',
      action: 'INITIALIZE_SYSTEM',
      entity: 'SYSTEM',
      entityId: 'SYSTEM_SETUP',
      newValue: 'Initial seed executed successfully with Pluakdaeng Hospital parameters',
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Engine'
    }
  });

  console.log('\n🎉 PDHSCHOOL Seeding finished successfully!');
  console.log('================================================================');
  console.log(`Super Admin User     : ${superAdminUsername}`);
  console.log(`Super Admin Email    : ${superAdminEmail}`);
  console.log(`Super Admin Password : ${adminPassword}`);
  console.log('Role Accounts        : training.admin, dept.pharmacy, preceptor.wisarut, inst.buu, viewer.guest');
  console.log('Default Password     : Pdh@123456');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
