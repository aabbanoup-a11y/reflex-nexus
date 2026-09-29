# Lovable review handoff — AbanoubAI

## المطلوب

اعتبر هذا المستودع ومشروع Supabase الحالي مصدر الحقيقة، وراجع التطبيق كاملًا قبل إجراء أي تعديل جديد. يجب إصلاح الأخطاء المؤكدة فقط، ثم تشغيل TypeScript/build وتسجيل النتيجة.

## العطل المبلغ عنه

المستخدم ذكر أن تسجيل الدخول بالبريد لم يعد يعمل بعد تعديلات دمج Companion. لم تصل لقطة شاشة أو نص الخطأ في آخر بلاغ، لذلك يجب عدم افتراض رسالة الخطأ.

## سبب تم تحديده وإصلاحه

كان التطبيق يستخدم عميلين لـ Supabase:

- `src/integrations/supabase/client.ts` — العميل القياسي.
- `src/integrations/supabase/runtime-client.ts` — عميل مكرر يعيد بناء Headers بطريقة مختلفة.

هذا سبب اختلاف سلوك Auth والجلسة بين الصفحات. تم جعل `runtime-client.ts` يعيد تصدير العميل القياسي فقط:

```ts
export { supabase } from "./client";
```

لا تنشئ عميل Supabase ثالثًا، ولا تغيّر عميل Auth دون اختبار `signInWithPassword`, `signUp`, `getUser`, `onAuthStateChange`, وتخزين الجلسة.

## إعداد Supabase الصحيح

كل الواجهة وAndroid Companion يجب أن تستخدم مشروع Supabase نفسه الموجود في:

```text
https://wobfdslqlmvlatyrtgkd.supabase.co
```

يُمنع خلطه مع أي مشروع Lovable قديم أو قيمة `VITE_SUPABASE_*` مختلفة.

## Google OAuth

آخر فحص لإعدادات Supabase أظهر أن:

```text
google = false
github = false
email = true
```

لذلك لا تعتبر زر Google عاملًا قبل تفعيل مزود Google ببيانات OAuth صحيحة من Google Cloud. لا تستبدل فشل Google بتعديل عشوائي في صفحة الدخول.

## Companion Android

راجع هذه النقاط معًا:

1. `CompanionRuntime.kt` يتصل بـ Supabase Realtime ويستخدم نفس المشروع.
2. يجب إرسال heartbeat وإعادة الاتصال بعد تفعيل Accessibility.
3. لا تظهر حالة الجهاز `online` قبل نجاح `phx_join`.
4. يجب أن يكون جهاز Oppo في نفس قاعدة Supabase التي تقرأ منها صفحة Companion.
5. لا تنشئ أجهزة Android مكررة عند إعادة فتح الصفحة.
6. لا تعرض Access token للمستخدم إلا عند الحاجة، ولا ترسله إلى نطاق غير موثوق.

## بوابة القبول قبل اعتبار الإصلاح مكتملًا

- تسجيل الدخول بالبريد لحساب مؤكد يعمل وينتقل إلى `/memory`.
- إنشاء حساب جديد يعرض بوضوح ضرورة تأكيد البريد إذا لم تُنشأ جلسة.
- استعادة كلمة المرور تستخدم `/reset-password` وتعمل.
- الجلسة تبقى بعد تحديث الصفحة.
- صفحة Companion وAndroid يستخدمان نفس Supabase project.
- `npx tsc --noEmit --pretty false` ينجح.
- `npm run build` ينجح.
- أي فشل متبقٍ يُعرض برسالة الخطأ الحقيقية، لا برسالة عامة تخفي السبب.

## قاعدة العمل

راجع الكود الحالي أولًا، ثم غيّر أقل عدد ممكن من الملفات. لا تعِد تصميم صفحة الدخول ولا تغيّر مزود OAuth ولا تغيّر مشروع Supabase قبل إثبات السبب من الخطأ أو من إعدادات المشروع.
