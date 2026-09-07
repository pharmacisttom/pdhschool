const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const newPassword = '@Pdhschool10832';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const updated = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      active: true,
    },
    create: {
      username: 'admin',
      name: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
      email: 'admin@pluakdaenghospital.go.th',
      role: 'SUPER_ADMIN',
      passwordHash,
      active: true,
    },
  });

  console.log('Admin password updated successfully for user:', updated.username);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
