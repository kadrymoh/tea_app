# ⚡ دليل البدء السريع - Tea Management System

## 🎯 للتشغيل المحلي (Development)

### 1. قاعدة البيانات
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm start
# سيعمل على: http://localhost:4000
```

### 3. Frontend (أي تطبيق)
```bash
cd frontend/super-admin-web
cp .env.example .env
npm install
npm run dev
# سيعمل على: http://localhost:5176
```

---

## 🚀 للإطلاق في Production

### خطوة واحدة قبل الرفع:
```bash
# في root directory
node update-api-urls.js
```

هذا الـ script سيقوم بتحديث جميع URLs في الكود تلقائياً!

### ثم اتبع:
راجع **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** للخطوات التفصيلية.

---

## 📋 Checklist سريع

**قبل الـ Build:**
- [ ] تشغيل `node update-api-urls.js`
- [ ] إنشاء `.env` files من `.env.example` لكل app
- [ ] التأكد من `backend/.env` محدث

**Build:**
```bash
# في كل frontend app:
cd frontend/[app-name]
npm install
npm run build
```

**النتيجة:**
- `dist` folder في كل تطبيق جاهز للرفع

---

## 🌐 URLs النهائية

```
https://teaapp.twaasol.com/               → Landing
https://teaapp.twaasol.com/super-admin    → Super Admin
https://teaapp.twaasol.com/tenant/admin   → Admin
https://teaapp.twaasol.com/tenant/tea-boy → Tea Boy
https://teaapp.twaasol.com/room/{token}   → Meeting Room
```

---

## 📚 المزيد من التفاصيل

- **دليل النشر الكامل:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **ملخص التغييرات:** [PRODUCTION_CHANGES.md](./PRODUCTION_CHANGES.md)
- **الأمان:** [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)

---

## 💡 نصيحة

للحصول على أفضل تجربة:
1. اقرأ `PRODUCTION_CHANGES.md` لفهم التغييرات
2. اتبع `DEPLOYMENT_GUIDE.md` خطوة بخطوة
3. راجع `SECURITY_CHECKLIST.md` قبل الإطلاق

---

## 🆘 مشكلة؟

```bash
# Backend logs
pm2 logs tea-backend

# Database logs
docker logs tea-postgres

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

راجع Troubleshooting في [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
