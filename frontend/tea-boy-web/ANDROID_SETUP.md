# Android App Setup Guide - Tea Boy

## 1. تغيير أيقونة التطبيق (App Icon)

### الخطوات:
1. افتح Android Studio
2. انقر بزر الماوس الأيمن على مجلد `app/src/main/res`
3. اختر **New > Image Asset**
4. في النافذة التي تظهر:
   - **Icon Type**: اختر `Launcher Icons (Adaptive and Legacy)`
   - **Name**: اتركه `ic_launcher`
   - **Foreground Layer**: اختر `Image` ثم حدد صورتك
   - **Background Layer**: اختر لون أو صورة للخلفية
5. اضغط **Next** ثم **Finish**

### أو يدوياً:
قم بنسخ الصور إلى المجلدات التالية بالأحجام المناسبة:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192x192)
│   └── ic_launcher_round.png (192x192)
```

---

## 2. إضافة ملفات الصوت للإشعارات

### المجلد المطلوب:
```
android/app/src/main/res/raw/
```

### الملفات المطلوبة:
1. **new_order.wav** - صوت الطلب الجديد (صوت مميز ومنبه)
2. **prepared.wav** - صوت جاهزية الطلب (صوت متوسط)
3. **delivered.wav** - صوت التوصيل (صوت ناعم)

### ملاحظات:
- يجب أن تكون الملفات بصيغة `.wav` أو `.mp3` أو `.ogg`
- يجب أن تكون أسماء الملفات بأحرف صغيرة فقط وبدون مسافات
- مدة الصوت المثالية: 1-3 ثواني

### مثال لتحميل أصوات مجانية:
يمكنك تحميل أصوات من:
- https://freesound.org/
- https://mixkit.co/free-sound-effects/notification/

---

## 3. بناء التطبيق

### الخطوات:
```bash
cd frontend/tea-boy-web

# تثبيت الحزم
npm install

# بناء الويب
npm run build

# مزامنة مع Android
npx cap sync android

# فتح في Android Studio
npx cap open android
```

### في Android Studio:
1. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. أو **Build > Generate Signed Bundle / APK**

---

## 4. إعدادات الإشعارات في الكود

تم إعداد 3 قنوات إشعارات (Notification Channels):

| Channel ID | الاسم | الوصف | الصوت |
|------------|-------|-------|-------|
| `new_order` | New Orders | إشعارات الطلبات الجديدة | new_order.wav |
| `order_prepared` | Order Prepared | إشعارات جاهزية الطلبات | prepared.wav |
| `order_delivered` | Order Delivered | إشعارات التوصيل | delivered.wav |

---

## 5. سلوك الإشعارات

### عندما يكون التطبيق مفتوح (Foreground):
- يظهر Toast داخل التطبيق فقط
- يشتغل صوت داخلي
- لا يظهر إشعار في شريط الإشعارات

### عندما يكون التطبيق مغلق/في الخلفية (Background):
- يظهر إشعار في شريط الإشعارات
- يشتغل صوت الإشعار المخصص
- اهتزاز الجهاز

---

## 6. الصلاحيات المطلوبة

تم إضافتها تلقائياً في `AndroidManifest.xml`:
- `POST_NOTIFICATIONS` - إرسال الإشعارات
- `VIBRATE` - الاهتزاز
- `RECEIVE_BOOT_COMPLETED` - استعادة الإشعارات بعد إعادة التشغيل
- `SCHEDULE_EXACT_ALARM` - جدولة الإشعارات
- `WAKE_LOCK` - إيقاظ الجهاز للإشعارات
