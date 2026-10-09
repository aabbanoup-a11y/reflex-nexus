# التقرير الشامل لمشروع AbanoupAI / Reflex Nexus

**تاريخ التقرير:** 2026-10-09  
**المستودع المتصل:** `aabbanoup-a11y/reflex-nexus`  
**رابط GitHub:** https://github.com/aabbanoup-a11y/reflex-nexus  
**التطبيق المذكور في README:** https://reflex-nexus.lovable.app  
**حالة النسخة المحلية:** متزامنة مع `origin/main`

---

## 1. الملخص التنفيذي

المشروع عبارة عن منصة مساعد ووكيل متعدد المسارات تجمع بين:

- واجهة شات عربية.
- شبكة نماذج ذكاء اصطناعي مع مدير وفرق متخصصة.
- نماذج محلية تعمل داخل المتصفح بعد تنزيلها.
- Android Companion للتحكم المحدود في الهاتف بعد موافقة المستخدم.
- تخزين وذاكرة عبر Supabase.
- تكاملات GitHub وCloudflare وBrowser Rendering في طبقة الوكيل.
- مسارات لإنشاء أدوات جديدة، جدولة مهام، حفظ المصنوعات، وتسجيل تحديثات الوكيل.

**الإنجاز الذي تم في هذه الجولة:**

1. التعديلات رُفعت إلى نفس مستودع GitHub المتصل، وليس إلى مستودع جديد.
2. أُنشئ فرع عمل `ai-team` ثم رُفع إلى GitHub.
3. أُنشئ Pull Request رقم 1.
4. تم دمج Pull Request في `main` بنجاح.
5. تم تحديث النسخة المحلية إلى `origin/main`.
6. تم توصيل `/chat/$id` بوكيل `networkTurn` التنفيذي مع fallback محلي.
7. نجحت اختبارات TypeScript وVite وAndroid Companion.

**الملاحظة التشغيلية الأهم:** الكود منشور في GitHub، لكن فحص قاعدة Supabase الفعلية أظهر أن بعض migrations الجديدة لم تُطبّق على المشروع المتصل بعد. كذلك يوجد Worker Cloudflare في الكود، لكن لم يتم إثبات نشره فعليًا في الحساب من خلال جلسة التنفيذ الحالية.

---

## 2. تاريخ المشروع من البداية حتى الآن

### المرحلة الأولى: أساس المشروع

المشروع مبني باستخدام TanStack Start وReact وVite وTypeScript وTailwind، مع تكامل Supabase وواجهة Lovable مذكورة في README.

الواجهة الأساسية تتضمن:

- صفحة رئيسية.
- مساعد عام.
- صفحة شبكة النماذج `/network`.
- صفحة الوكيل `/agent`.
- صفحة Companion `/companion`.
- صفحة الذاكرة `/memory`.
- صفحة المسارات `/paths-ui`.
- صفحات الصور والمكتبة والمشروعات وRemote والمهام المجدولة والإضافات.

### المرحلة الثانية: الهاتف وCompanion

تم إنشاء Android Companion بالحزمة:

```text
com.abanoubai.companion
```

ويحتوي على:

- `AccessibilityService` لتنفيذ الضغط والكتابة والسحب المسموح.
- `ForegroundService`.
- `BootReceiver`.
- `NotificationListener`.
- جرد التطبيقات والجهاز.
- التحكم الصوتي.
- استقبال أوامر Supabase Realtime.
- تنفيذ أوامر الهاتف وتسجيل الأحداث.

التطبيق ليس تحكمًا مطلقًا في Android. بعض الصلاحيات تحتاج موافقة المستخدم، وبعض إجراءات النظام الحساسة لا يمكن تنفيذها من صفحة ويب وحدها.

### المرحلة الثالثة: الوكيل المحلي والشبكة

تمت إضافة:

- مدير AbanoupAi.
- شبكة نماذج متعددة.
- fallback بين النماذج.
- نماذج محلية عبر WebLLM/MLC بعد التنزيل.
- نظام تفويض لأدوار مثل coding وbrowser وgeneral.
- قراءة حالة الأجهزة والأحداث.
- تخزين الرسائل المشتركة في Supabase.

### المرحلة الرابعة: Product Agent وSelf-Evolution

تمت إضافة طبقات لإنشاء الأدوات والمسارات والتحديثات:

- `agent_paths`
- `agent_commands`
- `agent_updates`
- `agent_tools`
- `scheduled_jobs`
- `artifacts`

يوجد دعم لإنشاء أداة جديدة عندما يكون الأمر غير معروف، لكن الأداة الجديدة لا تصبح تلقائيًا صلاحية غير محدودة على الهاتف أو حسابات خارجية؛ تحتاج دورة تسجيل وتنفيذ وصلاحيات مناسبة.

### المرحلة الخامسة: نظام Sidebar وChat

تمت إضافة:

- `ChatSidebar`.
- قائمة المحادثات.
- صفحات `/chat` و`/chat/$id`.
- حفظ الرسائل والمحادثات في Supabase بحسب المخطط المحلي.
- ردود fallback عربية مفيدة.
- مسار YouTube يرسل أمر فتح/بحث للهاتف عند وجود Companion.

### المرحلة السادسة: إصلاح fallback

تم حذف رسالة:

```text
كل مسارات الذكاء الاصطناعي غير متاحة
```

وأصبح fallback يرد برسالة عملية بدل عرض خطأ موصلات.

### المرحلة السابعة: توحيد الشات مع الوكيل

تم تعديل `/chat/$id` بحيث يحاول الآن تشغيل `networkTurn` أولًا، ثم ينتقل إلى fallback السحابي والمحلي إذا لم تتوفر خدمة الوكيل أو اعتماداته.

---

## 3. حالة GitHub الفعلية

### المستودع المستخدم

كل التعديلات الحالية موجودة في نفس المستودع المتصل:

```text
https://github.com/aabbanoup-a11y/reflex-nexus
```

لم يتم إنشاء مستودع بديل لهذا العمل.

### الفروع

- `main`: يحتوي النسخة المدمجة الحالية.
- `ai-team`: فرع العمل الذي رُفعت إليه التعديلات قبل الدمج.

### Pull Request

تم إنشاء ودمج:

- Pull Request: https://github.com/aabbanoup-a11y/reflex-nexus/pull/1
- العنوان: `feat: unified execution agent in chat`
- حالة الدمج: **Merged**

### آخر commit على main

```text
7a9e964 feat: unified execution agent in chat
```

### أهم commits

```text
7a9e964 feat: unified execution agent in chat
fb8fe0e merge: integrate product agent and local-first execution
7d3dd7c feat: local-first ui cron and agent paths
8e9a930 feat: self-evolving paths commands and resilient fallback
d8d7b93 feat: add offline device summary and scheduled jobs
0635706 feat: product-agent-v1
4814ed8 run local assistant models without cloud fallback
8897d68 unify team responses and strengthen model fallbacks
5617af9 make phone actions observe and summarize results
e6a6ab3 improve phone task planning and workspace skills
```

### حالة Git المحلية

```text
main == origin/main
working tree clean
```

---

## 4. مكونات الواجهة والمسارات

### المسارات العامة

- `/`
- `/auth`
- `/assistant`
- `/agent`
- `/network`
- `/chat`
- `/chat/$id`
- `/history`
- `/images`
- `/library`
- `/projects`
- `/remote`
- `/scheduled`
- `/plugins`

### المسارات المحمية

- `/_authenticated/companion`
- `/_authenticated/memory`
- `/_authenticated/paths-ui`

### الشات الموحد

الملف الأساسي:

```text
src/routes/chat.$id.tsx
```

ترتيب التنفيذ الحالي عند إرسال رسالة:

1. طلب YouTube المحدد يستخدم المسار الحتمي للهاتف.
2. باقي الطلبات تحاول `networkTurn` مع المدير `abanoupai/manager`.
3. الوكيل يختار النموذج والأدوات والبحث والتفويض عند توفر الخدمة.
4. إذا فشل الوكيل، يتم تجربة المساعد السحابي القديم.
5. إذا فشل السحابي، يتم استخدام fallback المحلي.
6. لا تظهر رسالة عدم توفر عامة للمستخدم.

---

## 5. طبقة الوكيل والأوامر

### الوكيل التنفيذي

الملفات الرئيسية:

```text
src/lib/network.functions.ts
src/lib/network.server.ts
src/lib/product-agent.functions.ts
src/core/command-executor.ts
src/core/command-protocol.ts
src/core/tool-factory.ts
```

### ما يستطيع الوكيل عمله من ناحية التصميم البرمجي

- تحليل الطلب.
- اختيار النموذج.
- تفويض المهمة لنموذج متخصص.
- تصفح صفحة وقراءة محتواها عبر Browser Rendering عند توفر التكامل.
- قراءة ملفات GitHub.
- كتابة ملفات في فرع العمل.
- قراءة بعض جداول Supabase.
- إضافة صفوف في الجداول المسموحة.
- إرسال أوامر Companion للهاتف.
- إنشاء أداة عند وجود أمر غير معروف.
- تسجيل artifact أو update أو path.
- تشغيل مسارات مجدولة.

### حدود الأمان الحالية

- GitHub write مصمم للفرع `ai-team`، وليس تعديل `main` مباشرًا من النموذج.
- عمليات الدمج يجب أن تمر بمسار GitHub منفصل.
- Cloudflare write محصور في مسارات محددة في `network.server.ts`.
- أوامر الهاتف الحساسة يجب أن تظل مرتبطة بالموافقة والصلاحيات المناسبة.
- لا يوجد حذف شامل تلقائي من النموذج.
- لا ينبغي اعتبار إنشاء الأداة مساويًا لتثبيتها تلقائيًا على الهاتف.

### الأمر غير المعروف

يوجد مسار:

```text
unknown command -> create_tool -> tool-factory -> تسجيل الأداة
```

لكن التشغيل الكامل يحتاج:

- كتابة كود الأداة.
- اختباره.
- تسجيله في Supabase.
- نشره أو ربطه بمسار التنفيذ.
- تحديد الصلاحيات.

لذلك لا توجد صلاحية صحيحة أو آمنة تسمح للوكيل باختراع أي أمر وتنفيذه بلا قيود على كل حساب أو جهاز.

---

## 6. تكامل الهاتف Android Companion

### ملفات Android الأساسية

```text
android-companion/app/src/main/java/com/abanoubai/companion/CommandExecutor.kt
android-companion/app/src/main/java/com/abanoubai/companion/CompanionAccessibilityService.kt
android-companion/app/src/main/java/com/abanoubai/companion/CompanionBootReceiver.kt
android-companion/app/src/main/java/com/abanoubai/companion/CompanionForegroundService.kt
android-companion/app/src/main/java/com/abanoubai/companion/CompanionNotificationListener.kt
android-companion/app/src/main/java/com/abanoubai/companion/CompanionRuntime.kt
android-companion/app/src/main/java/com/abanoubai/companion/DeviceInventory.kt
android-companion/app/src/main/java/com/abanoubai/companion/LocalAgentController.kt
android-companion/app/src/main/java/com/abanoubai/companion/MainActivity.kt
android-companion/app/src/main/java/com/abanoubai/companion/VoiceController.kt
```

### أنواع الأوامر المدعومة في البروتوكول

- فتح تطبيق.
- الضغط بالإحداثيات.
- كتابة نص.
- السحب.
- Screenshot.
- قراءة نص الشاشة.
- تنزيل ملف.
- فتح ملف أو APK.
- فتح رابط.
- أوامر YouTube.

### متطلبات التشغيل الواقعي

- تثبيت Companion على الهاتف.
- تسجيل الدخول أو الاقتران.
- تفعيل Accessibility.
- السماح بالتشغيل في الخلفية على Oppo/ColorOS.
- تعطيل Battery Optimization للتطبيق عند الحاجة.
- وجود جلسة Realtime صحيحة.
- وجود جهاز في `companion_devices` بحالة online أو recently seen.

اختبار سياسة Companion الحالي نجح:

```text
companion auto-execution and YouTube search smoke test: PASS
```

---

## 7. Supabase

### عميل Supabase

المشروع يستخدم Supabase من خلال:

```text
src/integrations/supabase/client.ts
src/integrations/supabase/runtime-client.ts
src/integrations/supabase/runtime-auth.ts
```

### الجداول الموجودة فعليًا في المشروع المتصل وقت الفحص

تم فحص PostgREST مباشرة، وكانت النتيجة:

| الجدول | النتيجة |
|---|---|
| `memory_settings` | موجود |
| `user_memories` | موجود |
| `companion_devices` | موجود |
| `companion_commands` | موجود |
| `conversations` | غير موجود في schema cache |
| `messages` | غير موجود في schema cache |
| `agent_paths` | غير موجود في schema cache |
| `agent_commands` | غير موجود في schema cache |
| `agent_updates` | غير موجود في schema cache |
| `agent_tools` | غير موجود في schema cache |

### Migrations المحلية

يوجد في الريبو:

```text
supabase/migrations/20261009190000_product_agent_v1.sql
supabase/migrations/20261009192000_local_first_agent_system.sql
supabase/migrations/20261009193000_scheduled_jobs.sql
supabase/migrations/20261009194500_agent_evolution.sql
supabase/migrations/20261009200000_chat_system.sql
```

وجود ملف migration في GitHub لا يعني أنه طُبّق في قاعدة البيانات. التطبيق يحتاج صلاحية Migration/DDL أو Supabase CLI مرتبط بالمشروع.

### الذاكرة

الذاكرة الحالية تعتمد على:

- موافقة المستخدم.
- `consent = true`.
- `enabled = true`.
- `MEMORY_ENCRYPTION_KEY` على السيرفر.
- تشفير AES-GCM للمحتوى.

الذاكرة لا تحفظ معلومات جديدة بمجرد ظهورها في الشات من دون موافقة المستخدم.

### النتيجة

Supabase متصل على مستوى REST، لكن البنية الجديدة الخاصة بالشات والوكيل لم تكن مطبقة في قاعدة البيانات الفعلية وقت الفحص. لذلك يجب تطبيق migrations قبل اعتبار `/chat` والجداول الجديدة جاهزة للإنتاج.

---

## 8. Cloudflare

### ما هو موجود في الكود

- Workers AI.
- AI Gateway/مسارات fallback.
- Browser Rendering.
- قراءة موارد Cloudflare.
- كتابة محدودة في Workers/KV/D1/Pages.
- Worker مجدول للمهام.

### Worker الموجود

```text
cloudflare-worker/index.ts
cloudflare-worker/wrangler.toml
```

اسم Worker في الإعداد:

```text
abanoupai-local-first-scheduler
```

والجدولة الحالية:

```text
0 3 * * *
```

### الحساب الذي ظهر من token الجلسة

تمكنت الجلسة من رؤية حساب Cloudflare:

```text
64311aaf504fdb9b9d3d8a8680f50ffd
```

### ما يحتاج ضبطًا قبل نشر Worker

Worker يحتاج أسرارًا مثل:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

كما يحتاج تكامل التطبيق إلى بيانات حساب وGateway صحيحة حسب المسار المستخدم.

لم يتم تسجيل نجاح نشر Worker في هذه الجولة؛ لذلك لا يجب وصفه بأنه live قبل تنفيذ deploy والتحقق من endpoint والـ cron.

---

## 9. النماذج والذكاء الاصطناعي

### النماذج السحابية

يوجد سجل نماذج يتضمن Cloudflare وGoogle وOpenAI وAnthropic ومسارات محلية.

أمثلة:

- Llama.
- Qwen.
- DeepSeek.
- Gemma.
- GPT-OSS.
- Gemini.
- ChatGPT.
- Claude.

### النماذج المحلية

يوجد دعم لأسماء نماذج MLC/WebLLM مثل:

- Llama 1B/3B.
- Qwen 0.5B/1.5B/3B.
- Phi 3.5 Mini.
- Gemma 2B.
- Qwen Coder.
- TinyLlama.

النموذج المحلي يحتاج تنزيل الأوزان مرة واحدة على الجهاز. وجود الاسم في الكود لا يعني أن النموذج محمل فعليًا على الهاتف أو المتصفح.

### ترتيب fallback

المسار العام:

```text
Cloud/Agent -> cloud fallback -> local model -> helpful local response
```

---

## 10. النظام الشجري والذاكرة المستمرة

يوجد ملف:

```text
src/core/continuation-memory.ts
```

ويعرّف عقدًا من الأنواع:

- `request`
- `plan`
- `result`
- `error`

كما يحتوي على:

- `addMemoryNode`.
- `buildContinuationContext`.
- ترتيب نماذج offline fallback.

**الحالة الحالية:** الملف موجود، لكن فحص الاستخدام أظهر أنه ليس مربوطًا بعد بشكل كامل بدورة كل رسالة في `/chat/$id` لتسجيل request/plan/result/error تلقائيًا كشجرة دائمة في Supabase.

أما ذاكرة المستخدم المشفرة، فهي مرتبطة بمسار `memory.functions.ts` وموافقة المستخدم.

---

## 11. الاختبارات التي نجحت

```text
npm exec tsc -- --noEmit       PASS
npm run build                  PASS
npm run test:companion         PASS
git diff --check               PASS
```

نتيجة Android Companion:

```text
companion auto-execution and YouTube search smoke test: PASS
```

ملاحظة: بعض رسائل build عبارة عن تحذيرات deprecation في `inputValidator()`، وليست أخطاء تمنع البناء.

---

## 12. ما تم نشره فعليًا وما لم يتم نشره

### تم نشره/رفعه فعليًا

- آخر تعديلات الكود في نفس GitHub repository.
- فرع `ai-team`.
- دمج التعديلات في `main` عبر Pull Request رقم 1.
- النسخة المحلية متزامنة مع `origin/main`.

### موجود محليًا وفي GitHub لكنه يحتاج تحققًا خارجيًا

- تطبيق migrations الجديدة على Supabase.
- تشغيل الشات مع جدول `conversations/messages` في المشروع الفعلي.
- تشغيل agent paths/commands/updates على Supabase.
- نشر Worker Cloudflare.
- اختبار Cloudflare Browser Rendering على حساب حقيقي.
- اختبار تعديل GitHub من داخل الشات بعد ضبط runtime secrets.
- اختبار أمر حقيقي من الشات إلى هاتف Oppo فعلي.

---

## 13. الفجوات الحالية بدقة

1. **Supabase schema:** migrations الجديدة غير مطبقة في قاعدة البيانات التي تم فحصها.
2. **Cloudflare Worker:** ملف Worker موجود، لكن حالة النشر لم تثبت.
3. **Runtime secrets:** وجود كود التكامل لا يساوي وجود الأسرار في بيئة التطبيق المنشور.
4. **Tree memory:** البنية موجودة لكنها ليست دورة persistence كاملة مرتبطة بكل محادثة.
5. **Android:** التنفيذ يعتمد على موافقات وصلاحيات Android وليس تحكمًا مطلقًا.
6. **المصنوعات:** تسجيل artifact موجود، لكن رفع كل أنواع الصور والفيديو والمستندات يحتاج storage/upload pipeline مكتملًا لكل نوع.
7. **النشر العام:** لا يوجد دليل في هذه الجولة على أن النسخة المنشورة في Lovable أو Cloudflare أعادت البناء من آخر `main` بالفعل.

---

## 14. الخلاصة النهائية

المشروع الآن لديه أساس حقيقي لوكيل متعدد القدرات، وليس مجرد واجهة شات:

- GitHub متزامن مع التعديلات الأخيرة.
- `main` يحتوي التحديث المدمج.
- الشات الموحد يحاول استخدام الوكيل التنفيذي.
- Companion موجود مع أوامر هاتف حقيقية محدودة.
- البحث والتفويض وCloudflare/GitHub لها طبقات كود.
- الذاكرة المشفرة موجودة.
- نظام المسارات والأدوات والتحديثات موجود في migrations والكود.

لكن لا يصح وصف كل القدرات بأنها production-ready بنسبة 100% قبل:

1. تطبيق migrations على Supabase الفعلي.
2. التأكد من أسرار Cloudflare وGitHub في بيئة النشر.
3. نشر Worker والتحقق من cron/endpoint.
4. اختبار الشات الحقيقي مع حساب مصادق وجهاز Android فعلي.
5. ربط النظام الشجري بالتخزين المستمر.
6. اختبار مسار artifact لكل من صورة وفيديو ومستند.

**الوضع الحالي المختصر:** الكود مرفوع ومدمج في المستودع الأساسي، والاختبارات البرمجية ناجحة، أما تفعيل البنية الخارجية الكاملة فيحتاج تحققًا وتطبيقًا على خدمات Supabase وCloudflare الفعلية، وليس مجرد وجود ملفات الإعداد في GitHub.


---

## تحديث تنفيذي لاحق: تطبيق Supabase migrations

**بتاريخ 2026-10-09 بعد التحقق الإداري:** تم تطبيق migrations الخمس التالية بنجاح عبر موصل Supabase الإداري على المشروع:

```text
اسم المشروع: AbanoupAi
project_id/ref: wobfdslqlmvlatyrtgkd
```

المigrations المطبقة:

```text
product_agent_v1
local_first_agent_system
scheduled_jobs
agent_evolution
chat_system
```

وظهرت في سجل migrations الفعلي بإصدارات التطبيق، كما ظهرت الجداول التالية في `public`:

```text
artifacts
agent_tools
integration_registry
orders
agent_paths
agent_commands
scheduled_jobs
agent_updates
conversations
messages
```

وكل الجداول الجديدة مفعّل عليها RLS وفق سياسات الملكية الموجودة في ملفات migrations.

### تنبيه مهم عن اختلاف البيئات

إعداد `.env` المحلي للتطبيق يشير حاليًا إلى Lovable Cloud project ref:

```text
huekskmelmanmptfyowh
```

بينما migrations الإدارية أعلاه طُبقت على مشروع Supabase:

```text
wobfdslqlmvlatyrtgkd
```

هذا يعني أن قاعدة `AbanoupAi` أصبحت مجهزة، لكن التطبيق سيستخدمها فقط بعد تغيير إعدادات runtime إلى URL ومفتاح publishable الخاصين بهذا المشروع. لم أغيّر هذا الربط تلقائيًا لأن تبديل backend قد يفصل جلسات المستخدمين أو يغيّر بيانات الإنتاج. لا ينبغي اعتبار المشروعين قاعدة واحدة قبل تنفيذ قرار ربط واضح.


## خطة تشغيل الوكيل المحلي والهاتف

تم توحيد إعدادات التطبيق وAndroid Companion محليًا على مشروع `AbanoupAi`، وتم بناء APK بنجاح. أضيفت كذلك موافقة يدوية للأوامر الحساسة من لوحة Companion؛ الأوامر العادية تنفذ تلقائيًا، بينما أوامر الملفات والشاشة والكتابة والإعدادات والتنزيلات وworkflows تظهر في قائمة مراجعة قبل إرسالها للهاتف.

التطبيق Android الحالي يملك تنفيذًا محليًا حتميًا لأوامر مثل فتح التطبيقات والروابط والكاميرا وإعدادات Wi‑Fi وBluetooth وإمكانية الوصول وقراءة حالة الجهاز والملفات والإشعارات. عند عدم معرفة الطلب، يحفظه محليًا. لكنه لا يحتوي بعد على محرك LLM داخل APK؛ لذلك النموذج المحلي الموجود حاليًا هو WebLLM داخل المتصفح، وليس نموذجًا يعمل داخل الهاتف عند انقطاع الشبكة.

الربط الصحيح مع Hugging Face يحتاج اختيار نموذج مرخّص ومحوّل إلى GGUF ثم دمج محرك مثل `llama.cpp` داخل Android، مع إخراج JSON مقيد بأوامر مسموحة. توثيق Hugging Face يوضح أن GGUF مناسب للتشغيل عبر llama.cpp، وأن `llama-server` يوفر واجهة OpenAI محلية [1]. أما WebGPU/Transformers.js فهو مناسب للمتصفح مع اعتماد الدعم على الجهاز والمتصفح [2]. لا يُنصح ببناء المسار الجديد على TGI لأنه في وضع الصيانة، وتوصي Hugging Face بالمسارات اللاحقة مثل vLLM أو SGLang أو llama.cpp [3].

الخطوات التالية لنسخة الهاتف الكاملة هي: اختيار نموذج صغير مناسب لذاكرة الهاتف، تنزيله مرة واحدة عبر Wi‑Fi، دمج runtime Android، إضافة محلل JSON ومتحقق schema، ربطه بـ `LocalAgentController`، ثم اختبار الأوامر دون اتصال. النموذج لا يُسمح له بتثبيت تطبيقات أو تغيير حسابات أو حذف ملفات أو تغيير إعدادات حساسة دون موافقة صريحة وسجل تدقيق وزر إيقاف.

[1]: https://huggingface.co/docs/hub/en/gguf-llamacpp "Hugging Face GGUF usage with llama.cpp"
[2]: https://huggingface.co/docs/transformers.js/en/guides/webgpu "Hugging Face Transformers.js WebGPU guide"
[3]: https://huggingface.co/docs/text-generation-inference/en/index "Hugging Face Text Generation Inference status"
