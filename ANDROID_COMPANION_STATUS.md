# حالة ربط Lovable بتطبيق Android Companion

## ما تم بناؤه

- `supabase/migrations/20260927162000_android_companion.sql`: أجهزة، أوامر، أحداث، RLS، وRealtime publication، مع حالة `rejected` وtrigger لتحديث الجهاز.
- `src/lib/companion.functions.ts`: أوامر authenticated allowlisted من لوحة Lovable.
- `src/routes/_authenticated/companion.tsx`: صفحة التحكم المتجاوبة.
- `android-companion/`: مشروع Kotlin مستقل بخدمة Accessibility.
- `.github/workflows/android-companion.yml`: بناء APK عبر GitHub Actions.

## ما تم إكماله في هذه المرحلة

- طُبّقت جداول Companion على مشروع Supabase `AbanoupAi`.
- Android ينضم إلى Realtime باستخدام Access token، يحدّث `online/offline`، ويكتب `running/succeeded/failed` وسجل الأحداث.
- إضافة Chrome أصبحت تستخدم حالة `succeeded` المتوافقة مع قاعدة البيانات.
- تم تحديث إعداد Supabase المحلي إلى مشروع `wobfdslqlmvlatyrtgkd`.

## الحالة الحالية

- يوجد APK Debug قابل للتثبيت للتجربة على Oppo، ويتم تحديثه مع كل إصلاح Android.
- لوحة AbanoubAI مدمجة داخل التطبيق، والاقتران التلقائي يرسل `Device ID` و`Access token` من WebView إلى التطبيق.
- Android يبدأ الاتصال عند فتح التطبيق إذا كانت بيانات الربط محفوظة، ويعيد المحاولة بعد انقطاع Realtime.
- ما زال الاختبار الحقيقي على Oppo مطلوبًا للتحقق من قيود البطارية وColorOS، ولا يمكن تنفيذه من Sandbox.

## الأوامر المسموحة

`open_chrome`, `open_url`, `back`, `tap_text`, `type_text` بحد 500 حرف، و`stop`. لقطة الشاشة في Android مرفوضة بوضوح حتى إضافة MediaProjection وموافقة النظام؛ إضافة Chrome تدعم screenshot.

الأوامر المسموحة تُنفَّذ تلقائيًا بعد تسجيل الدخول وربط الجهاز، مع سجل تنفيذ وزر إيقاف طارئ. لا توجد صلاحية لقراءة كلمات المرور أو تجاوز CAPTCHA أو تنفيذ شراء/رسائل.
