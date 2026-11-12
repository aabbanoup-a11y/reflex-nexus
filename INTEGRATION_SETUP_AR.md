# إعداد الاتصالات المباشرة لوكلاء AbanoubAI

هذه النسخة لا تستخدم Lovable Connector Gateway للوصول إلى GitHub أو Supabase أو Cloudflare. يجب ضبط المتغيرات التالية كـ **Server-side Environment Variables** في منصة الاستضافة، وليس في كود الواجهة أو ملفات Git.

## 1) GitHub

المتغير:
- `GITHUB_TOKEN`

أنشئ Fine-grained Personal Access Token من إعدادات GitHub، وحدد المستودعات التي يحتاجها الوكيل فقط:
- `aabbanoup-a11y/reflex-nexus`
- `aabbanoup-a11y/abra-cadabra-repo`
- `aabbanoup-a11y/AbanoupAi`

الصلاحيات المطلوبة:
- Contents: Read and write
- Actions: Read
- Pull requests: Read and write
- Metadata: Read (تلقائي)

الوكيل يكتب في فرع الاختبار المحدد في `src/lib/models30.ts`، ولا يكتب في `main`. إنشاء Pull Request يتم كـ Draft ولا يحدث دمج تلقائي.

## 2) Cloudflare

المتغيرات:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

أنشئ API Token مخصصًا للحساب المطلوب وبأقل صلاحيات لازمة للموارد التي ستستخدمها:
- Workers Scripts: Read and Edit
- Workers AI: Read (وما يلزم لتشغيل inference حسب حسابك)
- Browser Rendering: Read
- Workers KV Storage: Read and Edit
- D1: Read and Edit
- Pages: Read and Edit
- R2: Read and Edit (لن يعمل إذا لم تكن خدمة R2 مفعّلة)

الكتابة الحالية تسمح بعمليات POST/PUT/PATCH على Workers وKV وD1 وPages وR2 فقط. لا يوجد حذف موارد أو تعديل إعدادات الحساب/المناطق من وكيل المحادثة.

## 3) Supabase

المتغيرات:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (سر خادمي فقط)
- `AGENT_OWNER_USER_ID` (UUID لحساب مالك المشروع المصرّح له باستخدام أدوات إدارة قاعدة البيانات)

يجب أن تكون قيمة `AGENT_OWNER_USER_ID` هي UUID لحساب المالك نفسه. أدوات إدارة قاعدة البيانات ترفض العمل إذا لم يتطابق المستخدم المسجل دخوله مع هذا المعرف. مفاتيح الخدمة لا تُرسل إلى المتصفح ولا تُعرض للنماذج.

أدوات قاعدة البيانات تدعم القراءة والإضافة وتعديل سجل محدد بالـID ضمن جداول `public) المعروفة. جداول الصلاحيات ومفاتيح WebAuthn وسجل التدقيق محمية من الكتابة الآلية. لا توجد أوامر حذف أو TRUNCATE أو تغيير بنية الجداول في هذا المسار.

## 4) مفاتيح مزودي النماذج (اختياري حسب النموذج)

- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` لتشغيل Workers AI.
- `OPENAI_API_KEY` لنماذج OpenAI.
- `ANTHROPIC_API_KEY` لنماذج Anthropic.
- `GOOGLE_AI_API_KEY` لنماذج Google AI.

غياب مفتاح مزود معيّن يعني أن النماذج التابعة له لن تعمل؛ لا يتم استخدام Lovable كبديل تلقائي.

## 5) تحقق آمن

من واجهة شبكة النماذج اطلب من المدير `INTEGRATIONS_STATUS`. ستظهر حالة وجود المتغيرات فقط (true/false)، دون عرض قيمها. ثم اختبر قراءة كل خدمة قبل أي كتابة. لا ترسل المفاتيح أو كلمات المرور داخل المحادثة.

## 6) البناء والتسليم

كل push إلى فرع الاختبار يشغّل `.github/workflows/ci-build.yml`. بعد تعديل ملفات المشروع اطلب من الوكيل `BUILD:reflex-nexus`. يعيد رابط سجل CI، ورابط Artifact APK عند نجاح بناء Android. روابط GitHub Artifacts تتطلب عادةً تسجيل الدخول بحساب لديه صلاحية على المستودع.
