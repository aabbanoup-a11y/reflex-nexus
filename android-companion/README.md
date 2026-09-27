# AbanoubAI Companion

تطبيق Android مستقل للهاتف، وليس تحويلًا للوحة الويب إلى WebView. يتصل بلوحة Lovable عبر Supabase Realtime ويستخدم `AccessibilityService` لتنفيذ أوامر محدودة على Chrome بعد موافقة المستخدم.

## الحالة الحالية

- مشروع Android/Kotlin مستقل داخل المستودع.
- خدمة Accessibility مع allowlist لأوامر: فتح Chrome، فتح رابط HTTP(S)، الرجوع، التقدم، الضغط على نص، والكتابة المحدودة.
- لا يقرأ كلمات المرور ولا ينفذ شراء أو رسائل أو تجاوز CAPTCHA.
- إعدادات Supabase تُحقن وقت البناء عبر `-PSUPABASE_URL` و`-PSUPABASE_PUBLISHABLE_KEY` ولا تُحفظ في Git.
- يحتاج مسار الاقتران ومصادقة الجهاز إلى تطبيق migration والواجهة المقابلة في لوحة Lovable قبل اختبار الاتصال الحي.

## البناء

يحتاج الجهاز الذي سيبني APK إلى Android SDK وJDK 17:

```bash
cd android-companion
./gradlew assembleRelease \
  -PSUPABASE_URL=https://PROJECT.supabase.co \
  -PSUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

بعد تثبيت APK على Oppo:

1. افتح التطبيق.
2. اربطه من لوحة AbanoubAI برمز اقتران لمرة واحدة.
3. افتح إعدادات إمكانية الوصول من داخل التطبيق.
4. فعّل AbanoubAI Companion.
5. اختبر أولًا فتح صفحة عامة فقط.

> لا يُعتبر الربط مكتملًا قبل تنفيذ الاقتران، تطبيق migration، وبناء APK واختبار أمر آمن على جهاز فعلي.
