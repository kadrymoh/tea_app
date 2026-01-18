# 🐳 Docker Guide - Tea Management System

## نظرة عامة

في هذا المشروع، **Docker يُستخدم فقط لـ PostgreSQL**. Backend سيعمل مباشرة على السيرفر مع PM2.

---

## 🎯 لماذا نستخدم Docker فقط للـ Database؟

### ✅ المميزات:
1. **سهل الإدارة**: تشغيل وإيقاف بأمر واحد
2. **معزول**: قاعدة البيانات في container منفصل
3. **Backup سهل**: نسخ احتياطي للـ volumes
4. **نفس البيئة**: Development و Production متطابقان
5. **لا حاجة لتثبيت PostgreSQL يدوياً**

### 🔄 لماذا Backend خارج Docker؟
- أسهل في التحديثات (`pm2 restart`)
- Logs واضحة ومباشرة (`pm2 logs`)
- Performance أفضل (no container overhead)
- Debugging أسهل

---

## 📋 Setup على السيرفر

### 1. تثبيت Docker و Docker Compose

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo apt install docker-compose -y

# إضافة المستخدم لمجموعة docker (اختياري)
sudo usermod -aG docker $USER
# ثم logout/login
```

### 2. التحقق من التثبيت

```bash
docker --version
# Output: Docker version 24.x.x

docker-compose --version
# Output: docker-compose version 1.29.x
```

---

## 🚀 تشغيل PostgreSQL

### 1. في Development (جهازك المحلي):

```bash
# في root directory
docker-compose up -d

# التحقق من التشغيل
docker ps

# يجب أن ترى:
# CONTAINER ID   IMAGE          STATUS          PORTS
# xxxxxxxxxxxx   postgres:16    Up 2 minutes    0.0.0.0:5432->5432/tcp
```

### 2. في Production (السيرفر):

**نفس الخطوات تماماً!**

```bash
cd /home/user/tea-app/tea-management-system

# تشغيل PostgreSQL
docker-compose up -d

# التحقق
docker ps
docker logs tea-postgres
```

---

## 🔌 كيف يتصل Backend بـ PostgreSQL؟

### في Docker Compose:

```yaml
ports:
  - "5432:5432"
```

هذا يعني:
- **داخل Container:** PostgreSQL يعمل على port `5432`
- **على Host Machine:** يُعرض على `localhost:5432`

### Backend Connection String:

```env
DATABASE_URL="postgresql://tea:password@localhost:5432/tea_db?schema=public"
```

Backend يتصل بـ `localhost:5432` **كأنه PostgreSQL مثبت مباشرة على السيرفر!**

---

## 🛠️ أوامر Docker المفيدة

### إدارة الـ Container:

```bash
# تشغيل
docker-compose up -d

# إيقاف
docker-compose stop

# إيقاف وحذف
docker-compose down

# إيقاف وحذف مع البيانات (احذر!)
docker-compose down -v

# إعادة التشغيل
docker-compose restart

# عرض الحالة
docker ps

# عرض جميع الـ containers (حتى المتوقفة)
docker ps -a
```

### Logs والـ Debugging:

```bash
# عرض logs
docker logs tea-postgres

# متابعة logs مباشرة
docker logs -f tea-postgres

# آخر 50 سطر
docker logs --tail 50 tea-postgres

# الدخول للـ container
docker exec -it tea-postgres bash

# الاتصال بـ PostgreSQL داخل Container
docker exec -it tea-postgres psql -U tea -d tea_db
```

### Database Operations:

```bash
# Backup
docker exec tea-postgres pg_dump -U tea tea_db > backup.sql

# Restore
cat backup.sql | docker exec -i tea-postgres psql -U tea -d tea_db

# التحقق من الجداول
docker exec -it tea-postgres psql -U tea -d tea_db -c "\dt"

# عرض حجم Database
docker exec -it tea-postgres psql -U tea -d tea_db -c "SELECT pg_size_pretty(pg_database_size('tea_db'));"
```

---

## 📊 Monitoring

### 1. حجم الـ Container:

```bash
docker system df

# عرض تفاصيل
docker system df -v
```

### 2. استخدام الموارد:

```bash
docker stats tea-postgres

# عرض مرة واحدة (بدون متابعة)
docker stats --no-stream tea-postgres
```

### 3. Disk Space للـ Volumes:

```bash
docker volume ls
docker volume inspect tea-management-system_postgres_data
```

---

## 🔐 الأمان

### 1. تغيير كلمة المرور:

في **docker-compose.yml:**
```yaml
environment:
  POSTGRES_PASSWORD: YOUR_STRONG_PASSWORD_HERE
```

في **backend/.env:**
```env
DATABASE_URL="postgresql://tea:YOUR_STRONG_PASSWORD_HERE@localhost:5432/tea_db?schema=public"
```

### 2. Network Isolation:

Docker Container معزول تلقائياً. فقط port 5432 معروض للـ host.

### 3. Firewall:

```bash
# السماح فقط بـ localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# أو حظر الوصول الخارجي تماماً (Docker يدير الوصول)
# لا حاجة لأي شيء، فقط لا تعرض 5432 للإنترنت
```

---

## 💾 Backup و Restore

### Backup تلقائي (Cron Job):

```bash
# فتح crontab
crontab -e

# إضافة backup يومي في الساعة 2 صباحاً
0 2 * * * docker exec tea-postgres pg_dump -U tea tea_db > /home/user/backups/tea_db_$(date +\%Y\%m\%d).sql
```

### Backup يدوي:

```bash
# مجلد للـ backups
mkdir -p ~/backups

# Backup
docker exec tea-postgres pg_dump -U tea tea_db > ~/backups/tea_db_$(date +%Y%m%d_%H%M%S).sql

# Backup مضغوط
docker exec tea-postgres pg_dump -U tea tea_db | gzip > ~/backups/tea_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore من Backup:

```bash
# من ملف عادي
cat ~/backups/tea_db_20250113.sql | docker exec -i tea-postgres psql -U tea -d tea_db

# من ملف مضغوط
gunzip -c ~/backups/tea_db_20250113.sql.gz | docker exec -i tea-postgres psql -U tea -d tea_db
```

---

## 🔄 التحديثات

### تحديث PostgreSQL Image:

```bash
# إيقاف Container
docker-compose down

# سحب أحدث image
docker-compose pull

# إعادة التشغيل
docker-compose up -d

# التحقق من الإصدار
docker exec tea-postgres psql -V
```

---

## 🐛 Troubleshooting

### Problem: Container لا يبدأ

```bash
# عرض الأخطاء
docker logs tea-postgres

# التحقق من docker-compose.yml
docker-compose config

# إعادة إنشاء Container
docker-compose down
docker-compose up -d
```

### Problem: Backend لا يتصل بـ Database

```bash
# 1. تأكد أن Container يعمل
docker ps | grep postgres

# 2. تأكد من Port
sudo netstat -tulpn | grep 5432

# 3. اختبر الاتصال
docker exec -it tea-postgres psql -U tea -d tea_db -c "SELECT 1;"

# 4. تأكد من DATABASE_URL في backend/.env
cat backend/.env | grep DATABASE_URL
```

### Problem: Out of Disk Space

```bash
# عرض حجم الاستخدام
docker system df

# حذف الـ containers المتوقفة
docker container prune

# حذف الـ images غير المستخدمة
docker image prune

# حذف كل شيء غير مستخدم (احذر!)
docker system prune -a
```

---

## 📈 Performance Tuning

### PostgreSQL Configuration:

يمكن تعديل `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: tea-postgres
    environment:
      POSTGRES_DB: tea_db
      POSTGRES_USER: tea
      POSTGRES_PASSWORD: tea123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command:
      - "postgres"
      - "-c"
      - "max_connections=100"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "effective_cache_size=1GB"
      - "-c"
      - "work_mem=16MB"
```

---

## ✅ Checklist

قبل Production:
- [ ] Docker و Docker Compose مثبتان
- [ ] تم تغيير POSTGRES_PASSWORD
- [ ] تم تحديث DATABASE_URL في backend/.env
- [ ] Container يعمل: `docker ps`
- [ ] Backend يتصل بنجاح
- [ ] Backup automation مفعّل
- [ ] Monitoring يعمل

---

## 🎯 الخلاصة

```
┌─────────────────────────────────┐
│      Linux Server               │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Docker Container        │  │
│  │  ┌────────────────────┐  │  │
│  │  │  PostgreSQL :5432  │  │  │
│  │  └────────────────────┘  │  │
│  └──────────────────────────┘  │
│           ↑ Port 5432          │
│           │                    │
│  ┌────────┴─────────────────┐  │
│  │  Backend (PM2)           │  │
│  │  localhost:5432          │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Nginx                   │  │
│  │  (Reverse Proxy)         │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

**Docker = PostgreSQL فقط**
**Backend = PM2 على السيرفر مباشرة**
**Frontend = Static files مع Nginx**

---

**ملاحظة:** هذا الـ setup **بسيط وفعال** ومناسب تماماً لهذا المشروع! 🚀
