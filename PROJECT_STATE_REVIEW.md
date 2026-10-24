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


---

## جولة صيانة — 2026-10-24 (بعد مراجعة main الحالية)

### مصدر الحقيقة
- المستودع: `aabbanoup-a11y/reflex-nexus`، الفرع `main`.
- آخر تغيير كود Android في هذه الجولة: [`c34ffcd361342e212915e140d8297adf73cec2b6`](https://github.com/aabbanoup-a11y/reflex-nexus/commit/c34ffcd361342e212915e140d8297adf73cec2b6).
- تمت مراجعة هذا الملف، `ABANOUPAI_AGENT_PLAN.md`، `OFFLINE_AGENT_PLAN_AR.md`، خطتي Lovable التاريخيتين، ومهام مشروع TickTick. لم تُستخدم نسخ Cloudflare/Replit/Base44 كمصدر أحدث.

### تغيير هذه الجولة — Android build configuration
- أُصلح التعامل مع قيمة Gradle الفارغة باستخدام `takeIf { it.isNotBlank() }`.
- أثناء المراجعة اتضح أن وضع مفتاح Supabase publishable المعروف سابقًا في fallback سيعيد استخدام قيمة موجودة في تاريخ المستودع، وهذا يخالف قاعدة عدم إعادة استخدام مفاتيح مكشوفة سابقًا. لذلك أزال commit `c34ffcd` هذا الـ fallback، وأصبح المفتاح الفارغ يمنع الاتصال برسالة Log غير حساسة بدل محاولة اتصال فاشلة.
- لا يوجد مفتاح جديد في الكود أو السجل. يحتاج الاتصال السحابي إلى مفتاح publishable جديد/معتمد يضبطه صاحب المشروع في GitHub Actions Secrets خارج الدردشة.
- Commit: [`c34ffcd`](https://github.com/aabbanoup-a11y/reflex-nexus/commit/c34ffcd361342e212915e140d8297adf73cec2b6).

### CI والأدلة
- [Android Companion APK run 40103698960](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40103698960): **IN PROGRESS** عند تسجيل هذه الجولة؛ لا يوجد artifact جديد معتمد بعد.
- [Self Maintenance run 40103698852](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40103698852): **PENDING** عند تسجيل هذه الجولة.
- [Self Maintenance run 40103567520](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40103567520): فحوص الويب و`test:offline-planner` و`test:companion` و`npm run build` نجحت على commit `8f0a6db`. لا يُعتمد artifact Android من ذلك commit لأنه استخدم fallback لمفتاح سبق ظهوره في المستودع.
- APK Debug فقط، ولا توجد نتيجة اختبار على Oppo حتى الآن.

### Android crash — ما ثبت وما لم يثبت
- الجهاز المستهدف حسب بلاغ المستخدم: OPPO A15، Android 10 / ColorOS 7.2، ذاكرة 2GB. العرض: التطبيق يبقى مفتوحًا حتى الضغط على «فتح صفحة AbanoupAI»، ثم يختفي.
- في `MainActivity`، مسار الضغط يفرض WebView داخل التطبيق على جهاز منخفض الذاكرة. لا توجد حتى الآن stack trace من Logcat أو نتيجة اختبار على الجهاز تثبت إن كان السبب انهيار WebView renderer أو خروجًا إلى المتصفح أو سببًا آخر.
- معالجة استثناءات بدء الخدمة السابقة لا تثبت حل هذا العطل. حالة السبب الجذري والإصلاح على الهاتف: **BLOCKED / UNCONFIRMED**.
- يجب أن يتضمن اختبار الجولة التالية فتح لوحة الويب على الجهاز، مع التقاط رسالة الخطأ/Logcat إن تكرر العطل. لا يُعلن الإصلاح قبل ذلك.

### Supabase — قراءة فقط
- قرئت Security وPerformance Advisors، وتعريفات دوال `SECURITY DEFINER` والسياسات المرتبطة بجداول الأدوار والموافقات وسجل التدقيق والصلاحيات.
- 14 دالة `SECURITY DEFINER` قابلة للتنفيذ من `authenticated`. الفحص أظهر أن الدوال التي راجعتها تضبط `search_path=public` وتتحقق من الدور داخل الدوال الحساسة، كما أن ACL الذي قرئ يعرض منح EXECUTE إلى `authenticated` وليس إلى `PUBLIC`. لا يُطبّق revoke جماعي قبل التحقق من الاستدعاءات المقصودة وسياسات RLS.
- `public.webauthn_challenges`: RLS مفعّل ولا توجد سياسات؛ يلزم التحقق من مسار Edge Function/الخادم الذي يستخدم الجدول قبل اقتراح migration.
- Performance Advisor أبلغ عن 44 مفتاحًا أجنبيًا بلا فهرس تغطية، إضافة إلى تحذيرات السياسات والفهارس الأخرى. لا تغييرات على الإنتاج ولا migration في هذه الجولة.

### قدرات ونواقص أخرى
- **Web/agent tests:** آخر فحوص مثبتة على `8f0a6db` ناجحة؛ لم يكتمل CI للـ HEAD الجديد بعد.
- **Local inference:** `QwenEngine.kt` حاليًا stub؛ `load() = false` و`model_id = cloud-only`. تشغيل LLM محلي دون إنترنت على Android = **BLOCKED / NOT IMPLEMENTED**؛ لا توجد مقارنة أداء فعلية أو fine-tuning مثبت.
- **Connectors:** أدوات فعلية متاحة في جلسة ChatGPT تشمل GitHub وSupabase وCloudflare وHugging Face وLovable وReplit وVercel وTickTick والملفات والمهام المجدولة. هذا يثبت توفر واجهات الموصلات هنا فقط، ولا يثبت نجاح كل عملية read/write أو أن كل خدمة متصلة بحساب المشروع. البحث عبر الويب متاح؛ لا يوجد في هذه الجولة اختبار متصفح عام تفاعلي مستقل أو تكامل Base44 موثّق. Lovable يظل قراءة فقط حتى 2026-10-31.
- **Release:** لا يوجد إثبات توقيع Release بمفتاح توزيع دائم. Debug لا يساوي Release.

### الحالة الحالية
| المجال | الحالة | الدليل / العائق |
|---|---|---|
| Gradle blank property handling | CODE UPDATED | `c34ffcd`; CI لم ينته بعد |
| عدم إعادة استخدام المفتاح المكشوف | PASS على الكود الحالي | لا fallback للمفتاح؛ يحتاج صاحب المشروع إلى ضبط secret جديد خارج الدردشة |
| Android build/artifact للـ HEAD الحالي | BLOCKED / IN PROGRESS | run 40103698960 |
| سبب انهيار Oppo | BLOCKED | لا Logcat ولا اختبار جهاز بعد |
| Web/agent test suite | PASS على commit أسبق فقط | run 40103567520؛ إعادة تحقق HEAD الحالي مطلوبة |
| Supabase security | REVIEW REQUIRED | لا تغيير إنتاجي؛ يلزم تحليل استعمال WebAuthn قبل migration |
| Offline LLM | NOT IMPLEMENTED | `QwenEngine` cloud-only stub |
| Release signing | BLOCKED | مفتاح توزيع دائم غير مثبت |

**العائق التالي الوحيد:** اكتمال CI للـ HEAD `c34ffcd` ثم الحصول على إعداد مفتاح publishable جديد/معتمد عبر GitHub Secrets خارج الدردشة؛ بعد ذلك اختبار WebView على OPPO A15. لا ترسل أي أسرار في المحادثة.
