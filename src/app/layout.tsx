import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDHSCHOOL | ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน โรงพยาบาลปลวกแดง',
  description: 'Pluakdaeng Hospital Student Training & Internship Management System - ระบบบริหารจัดการรับนักศึกษาฝึกงาน การจัดสรรโควต้าตามกลุ่มงาน และการออกเอกสารรับรอง',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}
