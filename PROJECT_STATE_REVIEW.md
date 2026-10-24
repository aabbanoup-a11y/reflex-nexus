# مراجعة حالة AbanoubAI بعد تغييرات Lovable الأخيرة

## النتيجة العامة

راجعـت تاريخ Git حتى commit Lovable `aa30759` بعنوان «تم ربط الهاتف والـ30 بتطبيقك». Lovable لم يكتفِ بإصلاح صفحة الدخول؛ بل نقل المشروع إلى Lovable Cloud جديد، وجعل Android يفتح الموقع نفسه داخل WebView، وأضاف ربط الهاتف تلقائيًا بعد تسجيل الدخول عبر `AbanoubAI.pairSession(...)`.

## ما نفذه Lovable فعليًا

| الجزء | الحالة الحالية |
|---|---|
| الحسابات | خطة Lovable تقول إن البريد/كلمة المرور وGoogle يعملان، ويجب تأكيدهما عمليًا على الموقع؛ GitHub أزيل كمزود دخول. |
| Android | `MainActivity` أصبح WebView للموقع بدل شاشة إدخال الرموز القديمة. |
| الاقتران | `DeviceLink.tsx` ينشئ أو يستعيد جهاز Android ثم يرسل Access token وRefresh token إلى جسر Android تلقائيًا. |
| حالة الهاتف | `DeviceStatusCard` يعرض الهاتف وChrome متصلين/غير متصلين ويعرض زر Accessibility داخل التطبيق. |
| Companion | Realtime يستقبل الأوامر، وREST يحدث حالات الجهاز والأوامر والأحداث. |
| شبكة 30 نموذجًا | أضاف Lovable `network_messages` وقيودًا حسب المستخدم، ونقل `/network` إلى المسار المحمي. |
| Chrome | خطة Lovable تشير إلى pairing تلقائي بعد اكتشاف الإضافة، بينما الاختبار الحقيقي يحتاج Chrome والإضافة على جهاز المستخدم. |

## ما أضفته فوق عمل Lovable

- رفعت إصدار Android إلى `0.2.0` و`versionCode = 2`.
- أضفت إعادة اتصال تلقائية بـ Realtime بعد الانقطاع، كل 5 ثوانٍ.
- أبقيت تصميم Lovable الجديد كما هو ولم أرجع شاشة Device ID/Access token القديمة.
- أبقيت إعداد Lovable Cloud الذي تستخدمه نسخة Lovable الحالية، ولم أخلطه بمشروع Supabase القديم.

## فحوص تمت بنجاح

- `npx tsc --noEmit --pretty false`: ناجح.
- `npm run build`: ناجح.
- `./gradlew clean assembleDebug`: ناجح.
- APK package: `com.abanoubai.companion`.
- APK version: `0.2.0`.

## ما يزال ناقصًا أو يحتاج تجربة على أجهزتك

أولًا، الـAPK الحالي Debug وليس Release موقّعًا بمفتاح نشر دائم. هذا مناسب للتجربة، لكنه ليس نسخة متجر أو توزيع نهائية. ثانيًا، لا أستطيع من Sandbox تأكيد أن تسجيل الدخول Google أو أن WebView يحتفظ بجلسة Lovable Cloud على Oppo؛ يجب اختبارهما على الهاتف الحقيقي.

كذلك قد يوقف ColorOS التطبيق في الخلفية. إذا ظهر الهاتف غير متصل بعد الخروج من التطبيق، يجب السماح بالتشغيل التلقائي، تعطيل Battery Optimization للتطبيق، وقفل التطبيق في التطبيقات الأخيرة. لا يوجد حاليًا Foreground Service مستقل أو Boot Receiver، لذلك قد يلزم فتح التطبيق بعد إعادة تشغيل الهاتف.

لقطة الشاشة من Android غير منفذة؛ تحتاج MediaProjection وموافقة نظام منفصلة. الأوامر المسموحة حاليًا محدودة، والأوامر الحساسة تظل بحاجة إلى موافقة المستخدم. الاقتران التلقائي يعمل داخل APK لأن الجسر `AbanoubAI` موجود هناك؛ الموقع المفتوح في Chrome العادي لا يملك هذا الجسر، لكنه يستخدم مسار Chrome pairing الخاص به.

## تعليمات الاختبار الواقعية

ثبّت APK المرفق، افتحه، سجّل الدخول من داخل التطبيق، وافق على Accessibility، ثم راقب بطاقة «الهاتف» في الصفحة الرئيسية. اختبر بعد ذلك فتح رابط عام فقط. إذا ظهر «غير متصل»، لا تغيّر أي إعدادات عشوائيًا؛ أرسل نص الحالة أو صورة الصفحة، لأن الاحتمالات الأساسية وقتها ستكون إعدادات Lovable Cloud، جلسة WebView، أو قيود بطارية Oppo.

---

## سجل التشغيل الموحد — 2026-10-24

هذا القسم أحدث من الملخص التاريخي أعلاه، ويعتمد على `main` وSupabase الحاليين.

### الحالة المعتمدة

- GitHub main HEAD: [`5df5e50f76d3983a56a12fcfc947b7cb3faa7e04`](https://github.com/aabbanoup-a11y/reflex-nexus/commit/5df5e50f76d3983a56a12fcfc947b7cb3faa7e04).
- Supabase: المشروع `wobfdslqlmvlatyrtgkd`، الحالة `ACTIVE_HEALTHY`، PostgreSQL 17.6.1. لا توجد كتابة أو migration إنتاجية في هذه الجولة.
- راجعت مهام TickTick: سجل الحالة الموحد، Crash Android، CI، وBLOCKER اختبار Oppo. لم أضع علامة اكتمال على اختبار الجهاز.

### Android Companion 0.9.0

- Manifest يعلن `FOREGROUND_SERVICE_SPECIAL_USE` ويحدد `foregroundServiceType="specialUse"`، والخدمة تستخدم `FOREGROUND_SERVICE_TYPE_SPECIAL_USE` على Android 14+.
- commit `5df5e50f...` يضيف معالجة استثناء حول بدء الخدمة من `MainActivity.Bridge.pairSession()`، ويضيف أيضًا معالجة حول `CompanionRuntime.restart()`. هذا يحمي جسر WebView من مسار استثناء غير معالج؛ لا توجد حتى الآن stack trace من Oppo تثبت أنه سبب الانهيار الأصلي.
- **CI PASS:** [Android Companion run 40100941279](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40100941279) على commit `5df5e50f...`، اكتمل بنجاح في 2026-10-24.
- artifact: `abanoubai-companion-debug-apk`، الحجم 5,844,920 بايت، SHA-256 `cbf0a2869b43a09e128cf0b60642e2d6309d894b23689177d4001a536ab44815`. ملف Debug للتشخيص فقط، وليس Release.
- `debug.applicationIdSuffix=".test"` يفصل النسخة التشخيصية عن التطبيق المثبت ويحمي بيانات النسخة الحالية من الاستبدال. لم يتم اختبار هذا artifact على Oppo؛ لذلك حالة إصلاح crash على جهاز حقيقي = **BLOCKED**.

### عائق بناء قبل اختبار الاتصال

- سجل CI يعرض `-PSUPABASE_URL=` و`-PSUPABASE_PUBLISHABLE_KEY=` بقيم فارغة. في Gradle، `findProperty(...) ?: fallback` لا يستخدم fallback إذا كانت القيمة سلسلة فارغة؛ وقد ينتج BuildConfig فارغًا، فيتوقف `CompanionRuntime.start()` عند فحص عنوان Supabase.
- **الخطوة التالية:** تجاهل القيم الفارغة في build config أو تمرير القيم الافتراضية المقصودة عندما لا توجد secrets، ثم إعادة CI والتحقق من artifact جديد. مفتاح publishable ليس service-role ولا ينبغي طلب أسرار من المستخدم في الدردشة.
- بعد بناء صالح للاتصال، يلزم اختبار المستخدم على Oppo: فتح النسخة `(اختبار)`، تسجيل الدخول، تفعيل Accessibility يدويًا، تنفيذ فتح رابط عام، ثم التحقق بعد قفل الشاشة. لا ترسل بيانات الدخول.

### Supabase advisors — قراءة فقط

- Security: 14 تحذيرًا لدوال `SECURITY DEFINER` قابلة للتنفيذ من `authenticated`، وجدول `public.webauthn_challenges` لديه RLS دون سياسات، وحماية كلمات المرور المسربة معطلة.
- Performance: 17 فهرسًا مصنفًا غير مستخدم وفق الإحصاءات الحالية، و13 حالة سياسات permissive متعددة، وتحذيرات من إعادة تقييم دوال `auth.*` داخل سياسات RLS لكل صف.
- لم تتغير الدوال أو السياسات أو الفهارس. يلزم قراءة أجسام الدوال والسياسات وتحديد الصلاحيات المقصودة قبل اقتراح migration واختبار rollback.

### مصفوفة الحالة

| المجال | الحالة | الدليل / التالي |
|---|---|---|
| معالجة فشل بدء الخدمة من pairing | PASS على مستوى الكود فقط | commit `5df5e50f...`; السبب الأصلي غير مثبت |
| Android CI | PASS | [run 40100941279](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40100941279) |
| APK diagnostic | BUILT / NOT DEVICE-TESTED | artifact أعلاه؛ Debug فقط |
| اتصال Supabase في APK | BLOCKED | معاملات Gradle فارغة في سجل CI |
| اختبار Oppo | BLOCKED | يحتاج اختبارًا فعليًا من المستخدم |
| Release signing | BLOCKED | لم يُثبت مفتاح نشر دائم أو build Release صالح |
| Supabase security/performance | REVIEW REQUIRED | advisors قرئت؛ لا تغيير إنتاجي قبل فحص الدوال والسياسات |

**العائق التالي الوحيد:** إصلاح معالجة قيم Supabase الفارغة في Gradle وإعادة البناء والتحقق من artifact قبل طلب اختبار Oppo.
