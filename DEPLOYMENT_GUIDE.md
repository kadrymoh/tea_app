# 🚀 دليل النشر - Tea Management System

## نظرة عامة

هذا الدليل الشامل لنشر نظام إدارة المشروبات على سيرفر Linux مع Docker.

**النطاق:** `teaapp.twaasol.com`

## 📋 الهيكل النهائي للـ URLs

```
https://teaapp.twaasol.com/               → Landing Page (اختيار الواجهة)
https://teaapp.twaasol.com/super-admin    → Super Admin Dashboard
https://teaapp.twaasol.com/tenant/admin   → Admin Panel
https://teaapp.twaasol.com/tenant/tea-boy → Tea Boy Dashboard
https://teaapp.twaasol.com/room/{token}   → Meeting Room Interface

https://teaapp.twaasol.com/api/*          → Backend API
https://teaapp.twaasol.com (Socket.IO)    → WebSocket Connection
```

---

## 🎯 الخطوات الأساسية

### 1️⃣ إعداد السيرفر (Linux)

#### المتطلبات الأساسية:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo apt install docker-compose -y

# تثبيت Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت Nginx (للـ reverse proxy)
sudo apt install nginx -y

# تثبيت Certbot (للـ SSL)
sudo apt install certbot python3-certbot-nginx -y
```

---

### 2️⃣ رفع الملفات للسيرفر

#### باستخدام FileZilla أو SCP:
```bash
# من جهازك المحلي:
scp -r "f:\tea app demo\tea-management-system" user@your-server:/home/user/tea-app
```

أو استخدم FileZilla:
- Host: `your-server-ip`
- Port: `22`
- Protocol: `SFTP`

---

### 3️⃣ إعداد قاعدة البيانات (PostgreSQL في Docker)

```bash
cd /home/user/tea-app/tea-management-system

# تشغيل PostgreSQL
docker-compose up -d

# التحقق من التشغيل
docker ps

# يجب أن ترى:
# CONTAINER ID   IMAGE           STATUS
# xxxxxxxxxx     postgres:16     Up X seconds
```

**ملاحظة:** قاعدة البيانات ستعمل على المنفذ `5432` داخلياً.

---

### 4️⃣ إعداد Backend

```bash
cd /home/user/tea-app/tea-management-system/backend

# تثبيت Dependencies
npm install

# إنشاء ملف .env من .env.example
cp .env.example .env

# تحرير .env
nano .env
```

**محتوى `.env` للـ Production:**
```env
# Server
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL="postgresql://tea:YOUR_STRONG_PASSWORD@localhost:5432/tea_db?schema=public"

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tea.app.management@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=https://teaapp.twaasol.com

# JWT - استخدم مفتاح قوي!
JWT_SECRET=27a05ea6329f26af7e937ffdf0bb6cc55017c7a13588fea1d1ec7bd1e3fac5b85c02ab0294eb7d96d90e35e2ea64d6b29e262e7649382542aa47209a73c463a7
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=https://teaapp.twaasol.com

# App Info
APP_NAME=Tea Management System
APP_URL=https://teaapp.twaasol.com
```

#### تجهيز قاعدة البيانات:
```bash
# Generate Prisma Client
npx prisma generate

# Push Schema to Database
npx prisma db push

# (اختياري) إضافة بيانات تجريبية
# npx prisma db seed
```

#### تشغيل Backend (باستخدام PM2):
```bash
# تثبيت PM2
sudo npm install -g pm2

# تشغيل Backend
pm2 start src/server.js --name tea-backend

# حفظ التكوين
pm2 save

# تفعيل التشغيل التلقائي عند إعادة التشغيل
pm2 startup
# اتبع الأمر المعروض

# التحقق من الحالة
pm2 status
pm2 logs tea-backend
```

---

### 5️⃣ Build Frontend Apps

سنقوم ببناء جميع التطبيقات بعد تحديث الـ URLs.

#### أولاً: إنشاء `.env` files:

```bash
cd /home/user/tea-app/tea-management-system/frontend

# Super Admin
cd super-admin-web
cp .env.example .env
nano .env
```

**محتوى `.env`:**
```env
VITE_API_URL=https://teaapp.twaasol.com/api
VITE_SOCKET_URL=https://teaapp.twaasol.com
VITE_APP_NAME=Tea Management - Super Admin
```

**كرر نفس الخطوات لـ:**
- `admin-web`
- `tea-boy-web`
- `meeting-room-web`

#### ثانياً: Build جميع التطبيقات:

```bash
# Super Admin
cd /home/user/tea-app/tea-management-system/frontend/super-admin-web
npm install
npm run build

# Admin
cd ../admin-web
npm install
npm run build

# Tea Boy
cd ../tea-boy-web
npm install
npm run build

# Meeting Room
cd ../meeting-room-web
npm install
npm run build
```

بعد Build، ستجد المجلدات:
- `frontend/super-admin-web/dist`
- `frontend/admin-web/dist`
- `frontend/tea-boy-web/dist`
- `frontend/meeting-room-web/dist`

---

### 6️⃣ إعداد Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/teaapp.twaasol.com
```

**محتوى الملف:**
```nginx
# Backend API & WebSocket
upstream backend {
    server localhost:4000;
}

server {
    listen 80;
    server_name teaapp.twaasol.com;

    # Redirect HTTP to HTTPS (will be added after SSL)
    # return 301 https://$server_name$request_uri;

    # Root directory for static files
    root /home/user/tea-app/tea-management-system/frontend;
    index index.html;

    # Landing Page (Root)
    location = / {
        root /home/user/tea-app/tea-management-system/frontend/landing-page;
        try_files /index.html =404;
    }

    # Super Admin App
    location /super-admin {
        alias /home/user/tea-app/tea-management-system/frontend/super-admin-web/dist;
        try_files $uri $uri/ /super-admin/index.html;

        # Handle SPA routing
        location ~ ^/super-admin/.+$ {
            alias /home/user/tea-app/tea-management-system/frontend/super-admin-web/dist;
            try_files $uri /super-admin/index.html;
        }
    }

    # Admin App
    location /tenant/admin {
        alias /home/user/tea-app/tea-management-system/frontend/admin-web/dist;
        try_files $uri $uri/ /tenant/admin/index.html;

        location ~ ^/tenant/admin/.+$ {
            alias /home/user/tea-app/tea-management-system/frontend/admin-web/dist;
            try_files $uri /tenant/admin/index.html;
        }
    }

    # Tea Boy App
    location /tenant/tea-boy {
        alias /home/user/tea-app/tea-management-system/frontend/tea-boy-web/dist;
        try_files $uri $uri/ /tenant/tea-boy/index.html;

        location ~ ^/tenant/tea-boy/.+$ {
            alias /home/user/tea-app/tea-management-system/frontend/tea-boy-web/dist;
            try_files $uri /tenant/tea-boy/index.html;
        }
    }

    # Meeting Room App
    location /room {
        alias /home/user/tea-app/tea-management-system/frontend/meeting-room-web/dist;
        try_files $uri $uri/ /room/index.html;

        location ~ ^/room/.+$ {
            alias /home/user/tea-app/tea-management-system/frontend/meeting-room-web/dist;
            try_files $uri /room/index.html;
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO WebSocket
    location /socket.io/ {
        proxy_pass http://backend/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
```

#### تفعيل الموقع:
```bash
# إنشاء symbolic link
sudo ln -s /etc/nginx/sites-available/teaapp.twaasol.com /etc/nginx/sites-enabled/

# اختبار التكوين
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

---

### 7️⃣ تفعيل SSL (HTTPS) مع Let's Encrypt

```bash
# الحصول على شهادة SSL
sudo certbot --nginx -d teaapp.twaasol.com

# اتبع التعليمات:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# التحقق من التجديد التلقائي
sudo certbot renew --dry-run
```

Certbot سيقوم تلقائياً بتحديث ملف Nginx وإضافة SSL.

---

### 8️⃣ إعداد Firewall

```bash
# السماح بـ HTTP و HTTPS و SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# التحقق من الحالة
sudo ufw status
```

---

## 🔧 الأوامر المفيدة

### إدارة Backend (PM2):
```bash
# عرض الحالة
pm2 status

# عرض اللوجات
pm2 logs tea-backend

# إعادة التشغيل
pm2 restart tea-backend

# إيقاف
pm2 stop tea-backend

# حذف
pm2 delete tea-backend
```

### إدارة Database (Docker):
```bash
# عرض الـ containers
docker ps

# عرض اللوجات
docker logs tea-postgres

# إعادة التشغيل
docker-compose restart

# إيقاف
docker-compose stop

# حذف وإعادة إنشاء
docker-compose down -v
docker-compose up -d
```

### إدارة Nginx:
```bash
# اختبار التكوين
sudo nginx -t

# إعادة التحميل
sudo systemctl reload nginx

# إعادة التشغيل
sudo systemctl restart nginx

# عرض اللوجات
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔐 الأمان

### ✅ تأكد من:

1. **تغيير كلمة مرور PostgreSQL:**
   ```bash
   # في docker-compose.yml
   POSTGRES_PASSWORD: use_a_strong_password_here

   # في backend/.env
   DATABASE_URL="postgresql://tea:use_a_strong_password_here@localhost:5432/tea_db"
   ```

2. **استخدام JWT_SECRET قوي:**
   ```bash
   # Generate strong secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Firewall مفعّل:**
   ```bash
   sudo ufw status
   ```

4. **SSL مثبت:**
   ```bash
   sudo certbot certificates
   ```

---

## 📊 Monitoring & Logs

### Backend Logs:
```bash
pm2 logs tea-backend
pm2 logs tea-backend --lines 100
```

### Database Logs:
```bash
docker logs tea-postgres --tail 50 -f
```

### Nginx Logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 التحديثات المستقبلية

عند تحديث الكود:

```bash
# 1. سحب آخر التغييرات (أو رفع الملفات الجديدة)
cd /home/user/tea-app/tea-management-system
git pull  # إذا كنت تستخدم Git

# 2. تحديث Backend
cd backend
npm install
npx prisma generate
pm2 restart tea-backend

# 3. إعادة Build Frontend (إذا تغير)
cd ../frontend/super-admin-web
npm install
npm run build

# كرر لباقي التطبيقات

# 4. إعادة تحميل Nginx (إذا لزم الأمر)
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### المشكلة: Backend لا يعمل
```bash
# تحقق من اللوجات
pm2 logs tea-backend

# تحقق من المنفذ
sudo netstat -tulpn | grep 4000

# تحقق من قاعدة البيانات
docker ps
```

### المشكلة: قاعدة البيانات لا تتصل
```bash
# تحقق من Docker
docker ps
docker logs tea-postgres

# تحقق من الاتصال
docker exec -it tea-postgres psql -U tea -d tea_db
```

### المشكلة: Nginx 502 Bad Gateway
```bash
# تحقق من Backend
pm2 status
curl http://localhost:4000/api/health

# تحقق من Nginx config
sudo nginx -t
sudo systemctl status nginx
```

### المشكلة: SSL لا يعمل
```bash
# تحقق من الشهادات
sudo certbot certificates

# تجديد يدوي
sudo certbot renew --force-renewal
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من اللوجات أولاً
2. تأكد من تشغيل جميع الخدمات
3. تحقق من الـ firewall والمنافذ

---

## ✅ Checklist قبل الإطلاق

- [ ] قاعدة البيانات تعمل (Docker)
- [ ] Backend يعمل (PM2)
- [ ] جميع Frontend apps تم build-ها
- [ ] Nginx مكون بشكل صحيح
- [ ] SSL مثبت ويعمل
- [ ] Firewall مفعّل
- [ ] كلمات المرور قوية
- [ ] Environment variables محدثة
- [ ] تم اختبار جميع الواجهات
- [ ] Monitoring يعمل

---

## 🎉 النتيجة النهائية

بعد إكمال جميع الخطوات، سيكون لديك:

✅ `https://teaapp.twaasol.com/` - Landing page
✅ `https://teaapp.twaasol.com/super-admin` - Super Admin
✅ `https://teaapp.twaasol.com/tenant/admin` - Admin Panel
✅ `https://teaapp.twaasol.com/tenant/tea-boy` - Tea Boy
✅ `https://teaapp.twaasol.com/room/{token}` - Meeting Room

كل شيء آمن مع HTTPS، ويعمل بكفاءة! 🚀
