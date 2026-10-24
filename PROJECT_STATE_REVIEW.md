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

## جولة تدقيق تشغيلية — 2026-10-24

> هذا القسم هو السجل التشغيلي الأحدث. الأقسام أعلاه توثيق تاريخي أقدم ولا تمثل وحدها حالة `main` الحالية.

### المصدر والحالة

- المصدر المعتمد: [`main`](https://github.com/aabbanoup-a11y/reflex-nexus/tree/main)؛ آخر HEAD شوهد أثناء المراجعة: `8af629bc5890c533adcbd879e02a122b3f564d6c`.
- Supabase المتصل: `wobfdslqlmvlatyrtgkd`، الحالة `ACTIVE_HEALTHY`، PostgreSQL 17.6.1. لم تُنفذ أي كتابة أو migration على الإنتاج.
- تمت مراجعة مهام TickTick: سجل الحالة الموحد، إصلاح Android، CI، واختبار Oppo؛ ما زالت مهمة اختبار Oppo مفتوحة.

### Android Companion 0.9.0

- **فحص المصدر:** Manifest يعلن `FOREGROUND_SERVICE` و`FOREGROUND_SERVICE_SPECIAL_USE`، ويحدد `foregroundServiceType="specialUse"`. خدمة المقدمة تستدعي `startForeground(..., FOREGROUND_SERVICE_TYPE_SPECIAL_USE)` على Android 14+.
- **ملاحظة مدعومة بالمصدر:** مسار `MainActivity.Bridge.pairSession()` كان يستدعي `startForegroundService` دون معالجة الاستثناء، بخلاف مسار `onCreate()` الذي يحتوي بالفعل على `runCatching`. أضيفت معالجة محلية مع Log ورسالة للمستخدم حتى لا يفشل جسر WebView بسبب خطأ بدء الخدمة. هذا يزيل مسار استثناء غير معالج؛ **ولا يثبت أن هذا هو سبب الانهيار الأصلي** لعدم توفر stack trace من هاتف Oppo.
- التغيير على فرع `agent/guard-pair-session-service-start-20261024`، commit الكود: [`3a407472353be54f7a190eeb240124d8fc5c4117`](https://github.com/aabbanoup-a11y/reflex-nexus/commit/3a407472353be54f7a190eeb240124d8fc5c4117).
- **CI PASS:** [Android Companion APK run 71](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40100862961)، اكتمل بنجاح في 2026-10-24. تم إنشاء artifact `abanoubai-companion-debug-apk` بحجم 5,844,557 بايت، SHA-256: `cf6e54269577b034f092a329cb954c339b1ef754edfacdbfe2ee84c78bda4926`. هذا Debug APK فقط، وليس Release.
- إعداد `applicationIdSuffix = ".test"` موجود لنسخة debug؛ لذلك تُثبت بجانب النسخة الحالية ولا تستبدل بياناتها. لم يُختبر APK على Oppo، ولا نسجل إصلاح الانهيار كـ PASS.

### عائق بناء يجب حله قبل اختبار الاتصال الكامل

- سجل CI يعرض معاملات Gradle `-PSUPABASE_URL=` و`-PSUPABASE_PUBLISHABLE_KEY=` فارغة. وبما أن `findProperty(...) ?: fallback` لا يستبدل سلسلة فارغة، فقد ينتهي BuildConfig بقيم فارغة، ويؤدي فحص `CompanionRuntime.start()` إلى عدم بدء الاتصال. لذلك لا يُعد هذا artifact دليلًا على نجاح الاتصال أو اقتران Supabase؛ لا تطلب من المستخدم اعتبار الاتصال مُختبرًا حتى تُعالج هذه المشكلة ويصدر build جديد.
- الإجراء التالي: جعل إعدادات البناء تتجاهل القيم الفارغة وتستخدم الإعدادات العامة الافتراضية المقصودة، ثم إعادة CI والتحقق من artifact الجديد. مفتاح publishable ليس service-role ولا يُطلب من المستخدم إرساله في الدردشة.
- بعد نجاح ذلك، يبقى تدخل المستخدم مطلوبًا لاختبار النسخة `(اختبار)` على Oppo: فتح التطبيق، تسجيل الدخول، تفعيل Accessibility يدويًا، اختبار فتح رابط عام، ثم اختبار الاتصال بعد قفل الشاشة. لا ترسل بيانات دخول.

### Supabase advisors — قراءة فقط

- **Security:** 14 تحذيرًا لدوال `SECURITY DEFINER` قابلة للتنفيذ من `authenticated`، وجدول `public.webauthn_challenges` مع RLS دون سياسات، وحماية كلمات المرور المسربة معطلة.
- **Performance:** 17 فهرسًا غير مستخدم بحسب الإحصاءات الحالية، و13 حالة سياسات permissive متعددة، وتحذيرات من إعادة تقييم دوال `auth.*` داخل سياسات RLS لكل صف.
- لم تتغير الدوال أو السياسات أو الفهارس. الخطوة الآمنة التالية هي قراءة تعريفات الدوال والسياسات ذات الصلة وتحديد صلاحياتها المقصودة قبل اقتراح migration واختبار rollback.

### الحالة المختصرة

| المجال | الحالة | الدليل / التالي |
|---|---|---|
| حراسة استثناء بدء الخدمة بعد pairing | PASS للتغيير المصدري والبناء فقط | commit `3a407472...`؛ لا يثبت سبب الانهيار الأصلي |
| Android CI | PASS | [run 40100862961](https://github.com/aabbanoup-a11y/reflex-nexus/actions/runs/40100862961) |
| اتصال Supabase داخل APK الجديد | BLOCKED | متغيرات بناء فارغة في سجل CI؛ إصلاح إعداد البناء أولًا |
| اختبار الجهاز الحقيقي | BLOCKED | يحتاج اختبار المستخدم على Oppo |
| Supabase security/performance | REVIEW REQUIRED | advisors قرئت؛ لا تغيير إنتاجي قبل فحص الدوال والسياسات |
| Release signing | BLOCKED | المفتاح الدائم وإجراءات الإصدار لم تُثبت؛ Debug لا يساوي Release |

**العائق التالي الوحيد:** تصحيح التعامل مع معاملات Supabase الفارغة في Gradle وإعادة البناء والتحقق من artifact قبل اختبار Oppo.
