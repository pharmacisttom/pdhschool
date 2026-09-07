import { prisma } from '../src/lib/db/prisma';

async function initDirectorSignature() {
  await prisma.systemSetting.upsert({
    where: { key: 'HOSPITAL_DIRECTOR_NAME' },
    update: {},
    create: {
      key: 'HOSPITAL_DIRECTOR_NAME',
      value: 'นายแพทย์ผู้อำนวยการโรงพยาบาลปลวกแดง',
      description: 'ชื่อผู้อำนวยการโรงพยาบาล',
      category: 'BRANDING',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'HOSPITAL_DIRECTOR_POSITION' },
    update: {},
    create: {
      key: 'HOSPITAL_DIRECTOR_POSITION',
      value: 'ผู้อำนวยการโรงพยาบาลปลวกแดง',
      description: 'ตำแหน่งผู้อำนวยการโรงพยาบาล',
      category: 'BRANDING',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL' },
    update: {},
    create: {
      key: 'HOSPITAL_DIRECTOR_SIGNATURE_URL',
      value: '/signatures/director_signature.svg',
      description: 'URL ไฟล์ภาพลายเซ็นต์ผู้อำนวยการโรงพยาบาล',
      category: 'BRANDING',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'HOSPITAL_DIRECTOR_SHOW_SIGNATURE' },
    update: {},
    create: {
      key: 'HOSPITAL_DIRECTOR_SHOW_SIGNATURE',
      value: 'true',
      description: 'แสดงลายเซ็นต์ดิจิทัลในใบประกาศและเอกสารราชการ',
      category: 'BRANDING',
    },
  });

  console.log('Director signature settings successfully initialized');
}

initDirectorSignature()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
