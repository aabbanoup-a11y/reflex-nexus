# AbanoubAI Companion

تطبيق Android مستقل للهاتف، وليس تحويلًا للوحة الويب إلى WebView. يتصل بلوحة Lovable عبر Supabase Realtime ويستخدم `AccessibilityService` لتنفيذ أوامر محدودة على Chrome بعد موافقة المستخدم.

## الحالة الحالية

- مشروع Android/Kotlin مستقل داخل المستودع، ويتضمن الآن شاشة Companion ولوحة AbanoubAI داخلية عبر WebView.
- خدمة Accessibility مع allowlist لأوامر: فتح Chrome، فتح رابط HTTP(S)، الرجوع، الضغط على نص، والكتابة المحدودة.
- لا يقرأ كلمات المرور ولا ينفذ شراء أو رسائل أو تجاوز CAPTCHA.
- عنوان Supabase ومفتاح `publishable` العام مضمّنان كإعداد بناء افتراضي؛ لا يوجد service-role أو مفتاح خادم داخل التطبيق.
- أدخل `Device ID` و`Access token` قصير العمر من جلسة المستخدم في شاشة التطبيق؛ يُحفظان محليًا فقط ويُستخدم التوكن للانضمام إلى Realtime وتحديث السجل. زر **فتح لوحة AbanoubAI داخل التطبيق** يفتح صفحة تسجيل الدخول والتحكم من داخل APK نفسه.

## البناء

```bash
cd android-companion
./gradlew assembleRelease \
  -PSUPABASE_URL=https://PROJECT.supabase.co \
  -PSUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

بعد تثبيت APK على Oppo:

1. طبّق migration على مشروع Supabase المرتبط وسجّل الدخول إلى لوحة AbanoubAI.
2. أنشئ جهازًا من لوحة AbanoubAI واحصل على `Device ID`، واستخرج `Access token` من جلسة المستخدم لأغراض الاختبار فقط.
3. افتح التطبيق وأدخل `Device ID` و`Access token`.
4. افتح إعدادات إمكانية الوصول من داخل التطبيق.
5. فعّل AbanoubAI Companion.
6. اختبر أولًا فتح صفحة عامة فقط، ثم راجع حالة الأمر وسجل الحدث.

## APK الموحّد

بعد تثبيت النسخة الموحّدة، افتح التطبيق ثم استخدم زر **فتح لوحة AbanoubAI داخل التطبيق** بدل التنقل بين تطبيقين. يظل تثبيت APK وتفعيل Accessibility والموافقة على تحذير Android خطوات يدوية على الهاتف لحماية المستخدم.

> لا يُعتبر الربط مكتملًا قبل وجود جهاز مقترن بحسابك، وتطبيق migration، وتفعيل Accessibility يدويًا على هاتف فعلي. لقطة الشاشة في Android ما زالت موقوفة عمدًا حتى إضافة MediaProjection وموافقة النظام؛ لا تُرسل أمر `screenshot` لهذا العميل.
