# คู่มือการติดตั้งและ Deploy สู่ระบบ Production (Ubuntu 24.04)

## PDHSCHOOL
**ระบบบริหารจัดการนักเรียน นักศึกษา และแหล่งฝึกงาน โรงพยาบาลปลวกแดง**  
**Pluakdaeng Hospital Student Training & Internship Management System**

---

### 1. ข้อมูลสภาพแวดล้อม Production
- **Target OS**: Ubuntu 24.04 LTS (Noble Numbat)
- **Node.js**: v20 LTS หรือ v22
- **Process Manager**: PM2 (`pdhschool`)
- **Web Server & Reverse Proxy**: Nginx 1.24+ พร้อม HTTP/2 & Gzip
- **SSL Certificate**: Let's Encrypt ผ่าน Certbot
- **Database Engine**: MySQL 8.0+
- **Project Directory**: `/var/www/pdhschool`
- **Application Port**: `3003` (Internal localhost)
- **Production Domain**: `https://school.pluakdaenghospital.cloud`
- **System Timezone**: `Asia/Bangkok`

---

### 2. การเตรียม Server ครั้งแรก (First-Time Server Setup)

#### 2.1 ติดตั้ง Node.js 20+ และ Build Tools
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server certbot python3-certbot-nginx

# ติดตั้ง Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง PM2 ทั่วทั้งระบบ
sudo npm install -g pm2
```

#### 2.2 กำหนดค่า MySQL 8 และสร้าง Database
```bash
sudo mysql -u root
```
```sql
CREATE DATABASE pdhschool CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pdhschool_user'@'localhost' IDENTIFIED BY 'StrongGeneratedSecretPassword!2569';
GRANT ALL PRIVILEGES ON pdhschool.* TO 'pdhschool_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### 3. การติดตั้ง Application ครั้งแรก (Initial Installation)

```bash
# Clone หรือคัดลอกไฟล์โปรเจกต์มาที่ /var/www/pdhschool
sudo mkdir -p /var/www/pdhschool
sudo chown -R $USER:$USER /var/www/pdhschool
cd /var/www/pdhschool

# คัดลอกและตั้งค่า Environment
cp .env.example .env
nano .env
```

#### ตัวอย่างไฟล์ `.env` บน Production:
```env
NODE_ENV=production
PORT=3003
APP_URL=https://school.pluakdaenghospital.cloud
DATABASE_URL="mysql://pdhschool_user:StrongGeneratedSecretPassword!2569@127.0.0.1:3306/pdhschool"
AUTH_SECRET="f9b4c09d8e34892c5784918e9a2b53c8917e23a45c92847591e0a8b7c6d5e4f3"
SESSION_SECRET="3b819f72c918237e09a18475b829c719e0239485b719283746c5918273645e90"
TZ=Asia/Bangkok

# Initial Super Admin credentials for first seeding
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=ChangeAdminPasswordImmediately!2569
SEED_ADMIN_EMAIL=training@pluakdaenghospital.go.th

# n8n Webhook Integration
N8N_WEBHOOK_URL=https://n8n.pluakdaenghospital.cloud/webhook/pdhschool-events
N8N_WEBHOOK_SECRET=pdh_n8n_hmac_secret_key_2026
```

#### คำสั่งติดตั้งและเริ่มระบบ:
```bash
# 1. ติดตั้ง dependencies
npm ci

# 2. ตรวจสอบและ Generate Prisma Client
npx prisma validate
npx prisma generate

# 3. Deploy Database Schema Migrations
npx prisma db push

# 4. Seed ข้อมูลตั้งต้นของ รพ.ปลวกแดง (กลุ่มงาน, หลักสูตร, ผู้ใช้งานเริ่มต้น)
npm run prisma:seed

# 5. Build โปรเจกต์ Next.js สำหรับ Production
npm run build

# 6. เริ่มต้นกระบวนการด้วย PM2
pm2 start npm --name pdhschool -- start -- -p 3003
pm2 save
pm2 startup
```

---

### 4. การตั้งค่า Nginx Reverse Proxy และ SSL

คัดลอกไฟล์การตั้งค่า Nginx:
```bash
sudo cp /var/www/pdhschool/nginx/pdhschool.conf /etc/nginx/sites-available/pdhschool.conf
sudo ln -s /etc/nginx/sites-available/pdhschool.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

ขอใบรับรองความปลอดภัย SSL จาก Let's Encrypt:
```bash
sudo certbot --nginx -d school.pluakdaenghospital.cloud
```

---

### 5. ลำดับคำสั่ง Deploy อัปเดตเวอร์ชันใหม่ (Continuous Deployment Workflow)

เมื่อมีการปรับปรุงโค้ดหรือดึงโค้ดล่าสุดจาก Git:

```bash
cd /var/www/pdhschool
git pull
npm ci
npx prisma validate
npx prisma generate
npx prisma db push
npm run build
pm2 restart pdhschool --update-env
```

---

### 6. การสำรองข้อมูล (Backup) และกู้คืน (Restore)

#### สำรองข้อมูลอัตโนมัติ (Cron Job):
```bash
# เพิ่มคำสั่งสำรองข้อมูลทุกเที่ยงคืน
sudo crontab -e
# 0 0 * * * /var/www/pdhschool/scripts/backup.sh >> /var/log/pdhschool_backup.log 2>&1
```

#### กู้คืนข้อมูล (Restore):
```bash
chmod +x /var/www/pdhschool/scripts/restore.sh
/var/www/pdhschool/scripts/restore.sh /var/backups/pdhschool/db_pdhschool_20260907_120000.sql.gz
```

---

### 7. ตรวจสอบสถานะระบบ (Health Check)

ทดสอบ Endpoint สุขภาพของระบบและฐานข้อมูล:
```bash
curl -I https://school.pluakdaenghospital.cloud/api/health
```
Response:
```json
{
  "status": "ok",
  "service": "pdhschool",
  "database": "connected",
  "timestamp": "2026-09-07T10:15:00.000Z"
}
```
