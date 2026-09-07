# PDHSCHOOL
### ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน โรงพยาบาลปลวกแดง
### Pluakdaeng Hospital Student Training & Internship Management System

ระบบเว็บแอปพลิเคชันระดับองค์กรสำหรับบริหารจัดการรับนักศึกษาฝึกปฏิบัติงาน จัดสรรโควต้าตามกลุ่มงาน อนุมัติคำขอจากสถาบันการศึกษา ติดตามการฝึกงาน ประเมินสมรรถนะ และออกหนังสือตอบรับพร้อม QR Code ดิจิทัล โรงพยาบาลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง

---

## 🌟 ฟีเจอร์หลัก (Key Modules)

1. **Quota Management Engine**: ระบบคำนวณและควบคุมโควต้าแบบไดนามิก ป้องกันการรับเกินจำนวน (Zero Overbooking) ด้วย Database Transactions
2. **Public Capacity Monitor (`/training-quota`)**: แสดงสถานะความจุและที่นั่งคงเหลือแบบเรียลไทม์ โดยไม่มีการเปิดเผยข้อมูลส่วนบุคคล (PII)
3. **Training Request Workflow**: กระบวนการยื่นคำขอส่งนักศึกษา พิจารณาคุณสมบัติ จัดสรรกลุ่มงาน และอนุมัติเป็นรายบุคคล
4. **Student Roster & Import/Export**: ทะเบียนนักศึกษาฝึกงาน รองรับการนำเข้าและส่งออกไฟล์ Excel พร้อมระบบ Mask เลขบัตรประชาชน
5. **Interactive Training Calendar (`/dashboard/calendar`)**: ปฏิทินแสดงตารางการฝึกงานของทุกกลุ่มงาน มุมมองรายเดือนและรายการ
6. **Clinical Preceptors**: ทะเบียนอาจารย์พี่เลี้ยงประจำกลุ่มงาน และการมอบหมายการดูแลนักศึกษา
7. **Attendance Tracking**: ระบบลงเวลาเข้า-ออก และบันทึกสถานะการมา/ขาด/ลา/มาสาย ประจำวัน
8. **Competency Evaluations**: แบบประเมินสมรรถนะวิชาชีพ 8 ด้าน พร้อมระบบคำนวณคะแนนและตัดเกรดอัตโนมัติ
9. **Official Document Generator with QR Code**: ออกหนังสือตอบรับ หนังสือแจ้งผล และหนังสือรับรอง พร้อมรหัส QR ตรวจสอบความถูกต้องที่ `/verify/[code]`
10. **n8n Webhook Outbound Dispatcher**: เชื่อมโยงระบบอัตโนมัติของโรงพยาบาลด้วย HMAC Signature และ Replay Protection
11. **Immutable Audit Logs**: บันทึกกิจกรรมสำคัญและการเปลี่ยนแปลงสถานะโควต้าอย่างละเอียด ไม่สามารถแก้ไขย้อนหลังได้
12. **Role-Based Access Control (RBAC)**: รองรับ 6 บทบาท (`SUPER_ADMIN`, `TRAINING_ADMIN`, `DEPARTMENT_ADMIN`, `PRECEPTOR`, `INSTITUTION`, `VIEWER`)

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript Strict Mode
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: MySQL 8.0+ & Prisma ORM
- **Authentication**: Secure Session Management with HttpOnly Cookies & bcrypt Password Hashing
- **Analytics**: Recharts
- **Utilities**: `xlsx` (Excel Processing), `qrcode` (QR Code Generator), `zod` (Validation)

---

## 🚀 การรันระบบบนเครื่องพัฒนา (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. ตั้งค่าไฟล์ .env
cp .env.example .env

# 3. สร้างฐานข้อมูลและตาราง
npx prisma db push

# 4. Seed ข้อมูลตั้งต้นของ รพ.ปลวกแดง
npm run prisma:seed

# 5. เริ่มรัน Development Server
npm run dev
```

เปิดบราวเซอร์ที่: `http://localhost:3000`

---

## 🔐 บัญชีสำหรับทดสอบระบบ (Demo Accounts)

| บทบาท (Role) | Username | รหัสผ่านเริ่มต้น | สิทธิ์การเข้าถึง |
|---|---|---|---|
| **Super Admin** | `admin` | `Admin@Pdh2569` | สิทธิ์สูงสุดทุกเมนู ตั้งค่าระบบ จัดการผู้ใช้ |
| **Training Admin** | `training.admin` | `Pdh@123456` | ผู้ประสานงานแหล่งฝึกกลาง อนุมัติโควต้า |
| **Dept Admin** | `dept.pharmacy` | `Pdh@123456` | ดูแลกลุ่มงานเภสัชกรรม มอบหมายพี่เลี้ยง |
| **Preceptor** | `preceptor.wisarut` | `Pdh@123456` | อาจารย์พี่เลี้ยง บันทึกเวลา และประเมินผล |
| **Institution** | `inst.buu` | `Pdh@123456` | ผู้แทน ม.บูรพา ยื่นคำขอส่งนักศึกษา |
| **Viewer** | `viewer.guest` | `Pdh@123456` | สิทธิ์เข้าดูรายงานและสถิติภาพรวม |

---

## 📖 การ Deploy สู่ Production

กรุณาศึกษาขั้นตอนอย่างละเอียดในเอกสาร: [README-PRODUCTION.md](README-PRODUCTION.md)
เป้าหมาย Production: `https://school.pluakdaenghospital.cloud`
