# دليل النسخ الاحتياطي والاستعادة | Backup & Restore Guide

## نظرة عامة | Overview

نظام نسخ احتياطي شامل لقاعدة بيانات Tea Management System يدعم:
- نسخ احتياطي محلي (يومي، أسبوعي، شهري)
- مزامنة مع سيرفر آخر (rsync/scp)
- رفع للسحابة (AWS S3, Google Cloud, Backblaze B2)
- إشعارات بالبريد الإلكتروني

---

## البدء السريع | Quick Start

### 1. إعداد التكوين | Setup Configuration

```bash
cd backend/scripts

# نسخ ملف التكوين
cp backup.config.example backup.config

# تعديل الإعدادات
nano backup.config
```

**الإعدادات المطلوبة:**
```bash
DB_NAME="tea_management"
DB_USER="postgres"
DB_PASSWORD="كلمة_المرور_هنا"
DB_HOST="localhost"
DB_PORT="5432"
```

### 2. تشغيل الإعداد | Run Setup

```bash
chmod +x setup-backup-cron.sh
sudo ./setup-backup-cron.sh
```

### 3. اختبار النسخ الاحتياطي | Test Backup

```bash
./backup.sh
```

---

## الأوامر السريعة | Quick Commands

| الأمر | الوصف |
|-------|--------|
| `./backup.sh` | تشغيل نسخ احتياطي الآن |
| `./restore.sh --list` | عرض النسخ المتاحة |
| `./restore.sh --latest` | استعادة آخر نسخة |
| `tail -f /var/log/tea-management-backup.log` | متابعة السجل |
| `crontab -l` | عرض المهام المجدولة |

---

## إعداد النسخ للسيرفر البعيد | Remote Server Backup

### الخطوة 1: إعداد SSH Key

```bash
# على السيرفر الأصلي
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_backup

# نسخ المفتاح للسيرفر البعيد
ssh-copy-id -i ~/.ssh/id_rsa_backup.pub user@backup-server.com
```

### الخطوة 2: تكوين backup.config

```bash
# تفعيل النسخ للسيرفر البعيد
ENABLE_REMOTE_SERVER="true"

# إعدادات السيرفر
REMOTE_SERVER="backup-server.com"    # أو IP
REMOTE_USER="backup"
REMOTE_PORT="22"
REMOTE_PATH="/var/backups/tea-management"
REMOTE_SSH_KEY="/root/.ssh/id_rsa_backup"
```

### الخطوة 3: اختبار الاتصال

```bash
# اختبار SSH
ssh -i ~/.ssh/id_rsa_backup backup@backup-server.com "echo 'Connection OK'"

# تشغيل النسخ الاحتياطي
./backup.sh
```

---

## إعداد النسخ للسحابة | Cloud Backup Setup

### AWS S3

```bash
# 1. تثبيت AWS CLI
sudo apt install awscli -y

# 2. تكوين AWS
aws configure
# AWS Access Key ID: xxxx
# AWS Secret Access Key: xxxx
# Default region: us-east-1
# Default output format: json

# 3. إنشاء Bucket
aws s3 mb s3://tea-management-backups

# 4. تكوين backup.config
ENABLE_CLOUD_BACKUP="true"
CLOUD_PROVIDER="s3"
S3_BUCKET="tea-management-backups"
S3_PREFIX="backups"
S3_STORAGE_CLASS="STANDARD_IA"  # أرخص للتخزين طويل المدى
```

### Google Cloud Storage

```bash
# 1. تثبيت Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# 2. إنشاء Bucket
gsutil mb gs://tea-management-backups

# 3. تكوين backup.config
ENABLE_CLOUD_BACKUP="true"
CLOUD_PROVIDER="gcs"
GCS_BUCKET="tea-management-backups"
GCS_PREFIX="backups"
```

### DigitalOcean Spaces (S3-Compatible)

```bash
# 1. إنشاء Space من لوحة التحكم

# 2. تكوين AWS CLI للـ Spaces
aws configure --profile digitalocean
# Access Key: من DigitalOcean
# Secret Key: من DigitalOcean
# Region: nyc3

# 3. تكوين backup.config
ENABLE_CLOUD_BACKUP="true"
CLOUD_PROVIDER="s3-compatible"
S3_BUCKET="your-space-name"
S3_PREFIX="backups"
S3_ENDPOINT="https://nyc3.digitaloceanspaces.com"
```

---

## استعادة النسخ الاحتياطي | Restore Backup

### من نسخة محلية

```bash
# عرض النسخ المتاحة
./restore.sh --list

# استعادة آخر نسخة
./restore.sh --latest

# استعادة نسخة محددة
./restore.sh /var/backups/tea-management/daily/tea_db_2026-01-31_02-00-00.sql.gz
```

### من AWS S3

```bash
./restore.sh --from-s3 s3://tea-management-backups/backups/daily/tea_db_2026-01-31.sql.gz
```

### من سيرفر بعيد

```bash
./restore.sh --from-remote /var/backups/tea-management/daily/tea_db_2026-01-31.sql.gz
```

### استعادة يدوية

```bash
# 1. إيقاف التطبيق
pm2 stop backend

# 2. استعادة قاعدة البيانات
gunzip -c backup.sql.gz | psql -U postgres tea_management

# 3. تحديث Prisma
cd backend && npx prisma generate

# 4. إعادة تشغيل التطبيق
pm2 restart backend
```

---

## جدول النسخ الاحتياطي | Backup Schedule

| النوع | التوقيت | الاحتفاظ |
|-------|---------|----------|
| يومي | 2:00 صباحاً | 30 يوم |
| أسبوعي | كل أحد | 12 أسبوع |
| شهري | أول الشهر | 12 شهر |

---

## هيكل الملفات | File Structure

```
backend/scripts/
├── backup.sh              # سكربت النسخ الاحتياطي الرئيسي
├── restore.sh             # سكربت الاستعادة
├── setup-backup-cron.sh   # إعداد المهام المجدولة
├── backup.config.example  # مثال التكوين
└── backup.config          # التكوين الفعلي (لا يُرفع لـ git)

/var/backups/tea-management/
├── daily/                 # النسخ اليومية
├── weekly/                # النسخ الأسبوعية
└── monthly/               # النسخ الشهرية
```

---

## حل المشاكل | Troubleshooting

### النسخ الاحتياطي فشل - صلاحيات

```bash
# إنشاء المجلدات بالصلاحيات الصحيحة
sudo mkdir -p /var/backups/tea-management/{daily,weekly,monthly}
sudo chown -R $USER:$USER /var/backups/tea-management
```

### فشل الاتصال بقاعدة البيانات

```bash
# اختبار الاتصال
psql -h localhost -U postgres -d tea_management -c "SELECT 1"

# إنشاء ملف .pgpass لتجنب طلب كلمة المرور
echo "localhost:5432:tea_management:postgres:YOUR_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass
```

### فشل المزامنة مع السيرفر البعيد

```bash
# اختبار SSH
ssh -i ~/.ssh/id_rsa_backup -p 22 user@server "echo OK"

# التأكد من وجود المجلد على السيرفر البعيد
ssh user@server "mkdir -p /var/backups/tea-management"
```

### فشل الرفع لـ S3

```bash
# اختبار AWS CLI
aws s3 ls

# اختبار الصلاحيات
aws s3 cp test.txt s3://your-bucket/test.txt
aws s3 rm s3://your-bucket/test.txt
```

---

## الاستعادة الطارئة | Emergency Recovery

إذا تعطل السيرفر بالكامل:

1. **إعداد سيرفر جديد** بنفس نظام التشغيل
2. **تثبيت المتطلبات:**
   ```bash
   # PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs

   # PM2
   npm install -g pm2
   ```

3. **استنساخ المشروع:**
   ```bash
   git clone <repository-url>
   cd tea-management-system/backend
   npm install
   ```

4. **إعداد قاعدة البيانات:**
   ```bash
   sudo -u postgres createdb tea_management
   ```

5. **تحميل واستعادة النسخة الاحتياطية:**
   ```bash
   # من S3
   aws s3 cp s3://bucket/backups/latest.sql.gz ./

   # استعادة
   gunzip -c latest.sql.gz | psql -U postgres tea_management
   ```

6. **إعداد البيئة:**
   ```bash
   cp .env.example .env
   nano .env  # تعديل الإعدادات
   npx prisma generate
   ```

7. **تشغيل التطبيق:**
   ```bash
   pm2 start index.js --name backend
   pm2 save
   pm2 startup
   ```

---

## أفضل الممارسات | Best Practices

1. **اختبر الاستعادة شهرياً** - تأكد أن النسخ تعمل
2. **احتفظ بنسخ في أماكن متعددة** - محلي + سيرفر بعيد + سحابة
3. **راقب السجلات** - تأكد من نجاح النسخ يومياً
4. **شفّر النسخ الحساسة** - خاصة في السحابة
5. **وثّق كل شيء** - سجل متى تم النسخ والاستعادة

---

## الدعم | Support

للمساعدة الطارئة، تواصل مع مسؤول النظام.
