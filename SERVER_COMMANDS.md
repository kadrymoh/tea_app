# أوامر السيرفر | Server Commands Cheat Sheet
## Ubuntu Server - Tea Management System

---

## 🔄 إدارة التطبيق (PM2)

```bash
# عرض حالة التطبيقات
pm2 status

# إعادة تشغيل الـ Backend
pm2 restart backend

# إعادة تشغيل كل التطبيقات
pm2 restart all

# إيقاف التطبيق
pm2 stop backend

# تشغيل التطبيق
pm2 start backend

# عرض اللوجات (مباشر)
pm2 logs

# عرض لوجات الـ backend فقط
pm2 logs backend

# عرض آخر 100 سطر من اللوجات
pm2 logs --lines 100

# مسح اللوجات
pm2 flush

# حفظ إعدادات PM2 (للتشغيل التلقائي بعد الريستارت)
pm2 save

# إعداد التشغيل التلقائي
pm2 startup
```

---

## 🗄️ قاعدة البيانات (PostgreSQL)

```bash
# الدخول لقاعدة البيانات
psql -h localhost -U tea -d tea_db

# تنفيذ أمر SQL مباشرة
psql -h localhost -U tea -d tea_db -c "SELECT * FROM \"Tenant\";"

# عرض الجداول
psql -h localhost -U tea -d tea_db -c "\dt"

# عرض حجم قاعدة البيانات
psql -h localhost -U tea -d tea_db -c "SELECT pg_size_pretty(pg_database_size('tea_db'));"

# نسخ احتياطي يدوي
PGPASSWORD=tea123 pg_dump -h localhost -U tea tea_db > backup.sql

# استعادة من نسخة
psql -h localhost -U tea -d tea_db < backup.sql
```

---

## 💾 النسخ الاحتياطي

```bash
# مسار السكربتات
cd /var/www/teaapp.twaasol.com/backend/scripts

# تشغيل نسخ احتياطي الآن
./backup.sh

# عرض النسخ المتاحة
./restore.sh --list

# استعادة آخر نسخة
./restore.sh --latest

# استعادة نسخة محددة
./restore.sh /var/backups/tea-management/daily/tea_db_2026-02-01.sql.gz

# عرض لوج النسخ الاحتياطي
tail -f /var/log/tea-management-backup.log

# عرض مهام الـ cron
crontab -l
```

---

## 🌐 Nginx

```bash
# إعادة تشغيل Nginx
sudo systemctl restart nginx

# إعادة تحميل الإعدادات (بدون قطع الاتصال)
sudo systemctl reload nginx

# اختبار صحة الإعدادات
sudo nginx -t

# عرض حالة Nginx
sudo systemctl status nginx

# عرض لوجات Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# تعديل إعدادات الموقع
sudo nano /etc/nginx/sites-available/teaapp.twaasol.com
```

---

## 🔧 النظام

```bash
# عرض استخدام الذاكرة
free -h

# عرض استخدام القرص
df -h

# عرض العمليات (مرتبة بالذاكرة)
htop
# أو
top

# عرض استخدام المنافذ
sudo netstat -tlnp
# أو
sudo ss -tlnp

# إعادة تشغيل السيرفر
sudo reboot

# إيقاف السيرفر
sudo shutdown now
```

---

## 📦 تحديث المشروع

```bash
# الذهاب لمجلد المشروع
cd /var/www/teaapp.twaasol.com

# سحب آخر التحديثات من Git
git pull origin main

# تحديث الـ Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy  # إذا كان هناك migrations جديدة
pm2 restart backend

# تحديث وبناء الـ Frontend (Admin)
cd ../frontend/admin-web
npm install
npm run build

# تحديث وبناء الـ Frontend (Super Admin)
cd ../super-admin-web
npm install
npm run build

# تحديث وبناء الـ Frontend (Meeting Room)
cd ../meeting-room-web
npm install
npm run build

# تحديث وبناء الـ Frontend (Tea Boy)
cd ../tea-boy-web
npm install
npm run build
```

---

## 📋 اللوجات والمراقبة

```bash
# لوجات PM2
pm2 logs

# لوجات النظام
sudo journalctl -xe

# لوجات Nginx
sudo tail -100 /var/log/nginx/error.log

# لوجات PostgreSQL
sudo tail -100 /var/log/postgresql/postgresql-*-main.log

# مراقبة الموارد في الوقت الحقيقي
htop

# مراقبة الشبكة
sudo iftop
```

---

## 🔐 SSL Certificate (Let's Encrypt)

```bash
# تجديد الشهادة
sudo certbot renew

# تجديد إجباري
sudo certbot renew --force-renewal

# عرض الشهادات
sudo certbot certificates

# إضافة شهادة جديدة
sudo certbot --nginx -d yourdomain.com
```

---

## 🛠️ أوامر سريعة مفيدة

```bash
# البحث عن ملف
find /var/www -name "filename.js"

# البحث في محتوى الملفات
grep -r "search text" /var/www/teaapp.twaasol.com/

# عرض حجم المجلدات
du -sh /var/www/teaapp.twaasol.com/*

# مسح الكاش
npm cache clean --force

# عرض المنافذ المستخدمة
sudo lsof -i :4000  # Backend port
sudo lsof -i :80    # HTTP
sudo lsof -i :443   # HTTPS
```

---

## ⚡ أوامر الطوارئ

```bash
# إذا توقف الموقع - أعد تشغيل كل شيء
sudo systemctl restart nginx
pm2 restart all

# إذا امتلأ القرص - احذف اللوجات القديمة
pm2 flush
sudo journalctl --vacuum-time=7d

# إذا الذاكرة ممتلئة - أعد تشغيل PM2
pm2 restart all

# استعادة قاعدة البيانات من آخر نسخة
cd /var/www/teaapp.twaasol.com/backend/scripts
./restore.sh --latest
```

---

## 📍 المسارات المهمة

| المسار | الوصف |
|--------|-------|
| `/var/www/teaapp.twaasol.com/` | مجلد المشروع |
| `/var/www/teaapp.twaasol.com/backend/` | الـ Backend |
| `/var/www/teaapp.twaasol.com/backend/.env` | متغيرات البيئة |
| `/var/www/teaapp.twaasol.com/backend/scripts/` | سكربتات النسخ الاحتياطي |
| `/var/backups/tea-management/` | النسخ الاحتياطية |
| `/var/log/tea-management-backup.log` | لوج النسخ الاحتياطي |
| `/etc/nginx/sites-available/` | إعدادات Nginx |

---

## 🔑 بيانات الاتصال

```bash
# قاعدة البيانات
Host: localhost
Port: 5432
Database: tea_db
User: tea
Password: tea123

# Backend API
http://localhost:4000
https://teaapp.twaasol.com/api
```
