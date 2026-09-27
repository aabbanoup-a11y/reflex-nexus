# حالة ربط Lovable بتطبيق Android Companion

## ما تم بناؤه

- `supabase/migrations/20260927162000_android_companion.sql`: أجهزة، أوامر، أحداث، RLS، وRealtime publication.
- `src/lib/companion.functions.ts`: أوامر authenticated allowlisted من لوحة Lovable.
- `src/routes/companion.tsx`: صفحة التحكم المتجاوبة.
- `android-companion/`: مشروع Kotlin مستقل بخدمة Accessibility.
- `.github/workflows/android-companion.yml`: بناء APK عبر GitHub Actions.

## ما لم يُدّعَ اكتماله

لا يوجد APK منشور أو جهاز Oppo مقترن بعد. لا يمكن تنفيذ أمر على هاتف فعلي قبل تطبيق migration، إضافة أسرار البناء في GitHub، بناء APK، تثبيته، وتفعيل Accessibility يدويًا.

## أوامر آمنة حاليًا

`open_chrome`, `open_url`, `back`, `forward`, `tap_text`, `type_text` بحد 500 حرف، `screenshot` (واجهة الحدث موجودة لكن الرفع الموقّع يحتاج المرحلة التالية)، `stop`.

تُعلّم أوامر فتح الروابط والضغط والكتابة كمحتاجة موافقة. لا توجد صلاحية لقراءة كلمات المرور أو تجاوز CAPTCHA أو تنفيذ شراء/رسائل دون موافقة.
