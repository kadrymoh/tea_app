# Security Checklist - Tea Management System

## ⚠️ CRITICAL - قبل الإطلاق في Production

### 1. Environment Variables

- [ ] **تغيير `JWT_SECRET` في `.env`**
  ```bash
  # Generate a strong random key
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  - القيمة الحالية **ضعيفة جداً**: `super-secret-jwt-key-change-this-in-production-2024`
  - يجب استخدام مفتاح عشوائي قوي (64+ bytes)

- [ ] **تأمين كلمة مرور البريد الإلكتروني**
  - استخدم Gmail App Password بدلاً من كلمة المرور الأساسية
  - أو استخدم AWS SES / SendGrid في production

- [ ] **تغيير `SUPER_ADMIN_SECRET_KEY`**
  - استخدم مفتاح عشوائي قوي
  - لا تشارك هذا المفتاح مع أحد

- [ ] **التأكد من `.env` في `.gitignore`**
  - ✅ تم إضافة `.gitignore` في root
  - تحقق من عدم رفع `.env` للـ repository

### 2. Database Security

- [ ] **تغيير كلمة مرور PostgreSQL**
  - القيمة الحالية: `tea123` (ضعيفة)
  - استخدم كلمة مرور قوية في production

- [ ] **تفعيل SSL للـ database connection**
  ```env
  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  ```

- [ ] **إصلاح Kitchen unique constraint**
  - في `schema.prisma` السطر 209
  - إعادة تفعيل: `@@unique([tenantId, kitchenNumber])`

### 3. API Security

- [ ] **إضافة Rate Limiting على Login endpoints**
  - منع brute force attacks
  - Limit: 5 محاولات كل 15 دقيقة

- [ ] **إضافة Rate Limiting على API endpoints**
  - Limit: 100 request كل 15 دقيقة للـ API العامة

- [ ] **تفعيل Helmet.js للـ security headers**
  ```bash
  npm install helmet
  ```

- [ ] **تفعيل CORS بشكل صحيح**
  - تحديد الـ origins المسموح بها فقط
  - عدم استخدام `*` في production

### 4. Frontend Security

- [ ] **نقل API URLs للـ environment variables**
  - ✅ تم إنشاء `.env.example` files
  - إنشاء `.env` files من الـ templates
  - تحديث الكود لاستخدام `import.meta.env.VITE_API_URL`

- [ ] **إزالة console.log من production**
  - 723 console.log في frontend code
  - استخدم conditional logging:
  ```javascript
  if (import.meta.env.DEV) {
    console.log('Debug info');
  }
  ```

- [ ] **تفعيل HTTPS في production**
  - استخدم Certbot + Let's Encrypt
  - راجع `PRODUCTION_SETUP.txt` للخطوات

### 5. Authentication & Authorization

- [ ] **التحقق من token expiry في Super Admin**
  - حالياً يستخدم localStorage فقط
  - إضافة JWT verification

- [ ] **إضافة password policy**
  - Minimum 8 characters
  - يجب أن تحتوي على: أحرف كبيرة + صغيرة + أرقام

- [ ] **إضافة account lockout بعد محاولات فاشلة**
  - Lock account بعد 5 محاولات فاشلة
  - Unlock بعد 30 دقيقة أو عبر email

### 6. Logging & Monitoring

- [ ] **استبدال console.log بـ Winston/Pino**
  - 125 console.log في backend
  - إضافة structured logging

- [ ] **إضافة audit logging**
  - تسجيل جميع العمليات الحساسة
  - من قام بماذا ومتى

- [ ] **إعداد monitoring & alerting**
  - استخدم PM2 أو Docker health checks
  - Alert عند حدوث errors

### 7. Data Protection

- [ ] **إضافة encryption للـ sensitive data**
  - Email passwords
  - Room tokens (optional - already random)

- [ ] **إضافة backup automation**
  - Daily database backups
  - Store في مكان آمن منفصل

- [ ] **إضافة data retention policy**
  - حذف old orders بعد X months
  - GDPR compliance إذا كان التطبيق في EU

### 8. Performance & Reliability

- [ ] **إضافة database connection pooling limits**
  - Already configured في Prisma
  - تأكد من القيم المناسبة

- [ ] **إضافة graceful shutdown**
  - ✅ موجود في `server.js`
  - تأكد من إغلاق جميع الـ connections

- [ ] **إضافة health check endpoint**
  - ✅ موجود: `/api/health`
  - تحسينه ليشمل database check

### 9. Testing

- [ ] **اختبار tenant isolation**
  - تأكد من عدم تسريب البيانات بين tenants
  - Test cross-tenant access attempts

- [ ] **اختبار authentication flow**
  - Login, logout, refresh tokens
  - Token expiry handling

- [ ] **اختبار Socket.IO**
  - Real-time notifications
  - Connection/disconnection handling

### 10. Documentation

- [ ] **توثيق API endpoints**
  - إضافة Swagger/OpenAPI documentation
  - أمثلة على الـ requests/responses

- [ ] **توثيق Environment Variables**
  - ✅ تم إنشاء `.env.example`
  - شرح كل متغير

- [ ] **إنشاء Admin Guide**
  - كيفية إضافة tenant جديد
  - كيفية إدارة المستخدمين

## 📋 Quick Pre-Production Checklist

قبل الإطلاق مباشرة، تأكد من:

```bash
# 1. Generate secure keys
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SUPER_ADMIN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Update .env file
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "SUPER_ADMIN_SECRET_KEY=$SUPER_ADMIN_SECRET" >> .env

# 3. Change database password
# Update in docker-compose.yml and .env

# 4. Enable HTTPS
# Follow PRODUCTION_SETUP.txt steps

# 5. Test everything
npm run test
npm run build

# 6. Deploy!
```

## 🔒 Security Contact

إذا اكتشفت ثغرة أمنية، يرجى التواصل مع:
- Email: security@yourdomain.com
- لا تنشر الثغرات علناً قبل إصلاحها

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
