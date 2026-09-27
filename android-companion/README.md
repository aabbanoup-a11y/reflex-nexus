# AbanoubAI Companion

تطبيق Android مستقل للهاتف، وليس تحويلًا للوحة الويب إلى WebView. يتصل بلوحة Lovable عبر Supabase Realtime ويستخدم `AccessibilityService` لتنفيذ أوامر محدودة على Chrome بعد موافقة المستخدم.

## الحالة الحالية

- مشروع Android/Kotlin مستقل داخل المستودع.
- خدمة Accessibility مع allowlist لأوامر: فتح Chrome، فتح رابط HTTP(S)، الرجوع، الضغط على نص، والكتابة المحدودة.
- لا يقرأ كلمات المرور ولا ينفذ شراء أو رسائل أو تجاوز CAPTCHA.
- عنوان Supabase ومفتاح `publishable` العام مضمّنان كإعداد بناء افتراضي؛ لا يوجد service-role أو مفتاح خادم داخل التطبيق.
- أدخل `Device ID` الذي تنشئه لوحة التحكم في شاشة التطبيق قبل الاتصال.

## البناء

```bash
cd android-companion
./gradlew assembleRelease \
  -PSUPABASE_URL=https://PROJECT.supabase.co \
  -PSUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

بعد تثبيت APK على Oppo:

1. أنشئ جهازًا مقترنًا من لوحة AbanoubAI واحصل على `Device ID`.
2. افتح التطبيق وأدخل `Device ID`.
3. افتح إعدادات إمكانية الوصول من داخل التطبيق.
4. فعّل AbanoubAI Companion.
5. اختبر أولًا فتح صفحة عامة فقط.

> لا يُعتبر الربط مكتملًا قبل وجود جهاز مقترن بحسابك، وتطبيق migration، وتفعيل Accessibility يدويًا على هاتف فعلي.
