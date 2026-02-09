# دليل بناء APK للـ Tea Boy

## المشكلة المهمة
الـ APK يحمّل الكود من السيرفر البعيد: `https://teaapp.twaasol.com/tenant/tea-boy`
لذلك يجب التأكد من أن الكود موجود على السيرفر.

## خطوات البناء الصحيحة

### الطريقة 1: استخدام السيرفر البعيد (الحالية)

```bash
cd frontend/tea-boy-web

# 1. بناء المشروع
npm run build

# 2. رفع مجلد dist للسيرفر في المسار: /tenant/tea-boy

# 3. فتح Android Studio وبناء APK
npx cap open android

# في Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**ملاحظة مهمة:** عند استخدام السيرفر البعيد، لا تحتاج `npx cap sync` لأن الكود يأتي من الإنترنت.

### الطريقة 2: APK مستقل (بدون سيرفر)

إذا أردت APK يعمل بدون الحاجة للسيرفر:

1. **عدّل capacitor.config.json:**
```json
{
  "appId": "com.twaasol.teaboy",
  "appName": "Tea Boy",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0ea5e9",
      "showSpinner": false
    },
    "LocalNotifications": {
      "smallIcon": "ic_notification",
      "iconColor": "#0ea5e9",
      "sound": "new_order"
    }
  },
  "android": {
    "allowMixedContent": true
  }
}
```

2. **ابنِ ونسخ:**
```bash
npm run build
npx cap sync android
npx cap open android
```

## التحقق من عمل الإشعارات

### 1. تأكد من الصلاحيات على الجهاز
- افتح إعدادات الجهاز
- ابحث عن تطبيق "Tea Boy"
- تأكد أن "الإشعارات" مفعّلة
- تأكد أن كل قنوات الإشعارات مفعّلة

### 2. تأكد من عدم تحسين البطارية
- إعدادات > البطارية > تحسين البطارية
- ابحث عن "Tea Boy"
- اختر "لا تحسّن" أو "Don't optimize"

### 3. اختبار الإشعارات
افتح التطبيق واتركه في الخلفية (اضغط زر Home)، ثم اطلب طلب جديد من تطبيق غرفة الاجتماعات.

## استكشاف الأخطاء

### إذا لم تظهر الإشعارات:
1. **احذف التطبيق وأعد تثبيته** - أحياناً Android يحتفظ بإعدادات قديمة
2. **افحص Logcat في Android Studio:**
   ```
   adb logcat | grep -i notification
   ```
3. **تأكد من وجود ملفات الصوت:**
   ```
   android/app/src/main/res/raw/new_order.mp3
   android/app/src/main/res/raw/prepared.mp3
   android/app/src/main/res/raw/delivered.mp3
   ```

### إذا لم يعمل الصوت:
1. تأكد أن الهاتف ليس في وضع الصامت
2. تأكد أن صوت الإشعارات مرفوع
3. قد تحتاج حذف التطبيق وإعادة تثبيته لتحديث قنوات الإشعارات

## الملفات المهمة

| الملف | الوظيفة |
|-------|---------|
| `capacitor.config.json` | إعدادات Capacitor |
| `android/app/src/main/res/raw/*.mp3` | ملفات الصوت |
| `android/app/src/main/AndroidManifest.xml` | صلاحيات Android |
| `src/pages/TeaBoyDashboard.jsx` | كود الإشعارات |
