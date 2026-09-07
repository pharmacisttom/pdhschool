import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user details with department and institution name
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      department: true,
      institution: true,
    },
  });

  if (!user || !user.active) {
    redirect('/login');
  }

  const userContext = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    departmentName: user.department?.nameThai || null,
    institutionName: user.institution?.nameThai || null,
  };

  return <DashboardShell user={userContext}>{children}</DashboardShell>;
}
