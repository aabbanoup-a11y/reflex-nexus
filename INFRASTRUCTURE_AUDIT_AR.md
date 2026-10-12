# التدقيق الفعلي للبنية — AbanoubAI

**التاريخ:** 2026-10-13  
**المستودع:** `aabbanoup-a11y/reflex-nexus`  
**الفرع:** `main`  
**آخر commit محلي وبعيد:** `325f96e`

## 1. GitHub

- المستودع موجود، خاص، والفرع الافتراضي `main`.
- الفروع الموجودة: `main` و`ai-team`.
- النسخة المحلية متزامنة مع `origin/main` ولا توجد تعديلات غير محفوظة.
- آخر تعديل تطبيقي هو إصلاح تطابق نموذج Qwen مع الأصل المضمّن داخل APK.
- توجد GitHub Actions سابقة ناجحة لبناء Android Companion، لكن وجود تشغيل ناجح سابق لا يثبت تلقائيًا أن كل commit لاحق نُشر كـAPK جديد.
- رابط المستودع: https://github.com/aabbanoup-a11y/reflex-nexus

## 2. Supabase الإنتاجي

المشروع الصحيح هو:

- الاسم: `AbanoupAi`
- ref/id: `wobfdslqlmvlatyrtgkd`
- الحالة: `ACTIVE_HEALTHY`
- المنطقة: `eu-west-1`
- PostgreSQL: 17.6.1.155

### الجداول موجودة

جداول Companion والوكيل والمحادثات والكتالوج موجودة، وكلها RLS مفعّل عليها. الجداول المهمة تشمل `companion_devices`, `companion_commands`, `companion_events`, `scheduled_jobs`, `conversations`, `messages`, `command_catalog`, `skill_catalog`, و`path_catalog`.

### أعداد الكتالوج الفعلية

| الكتالوج | الإجمالي | implemented | cataloged | planned |
|---|---:|---:|---:|---:|
| الأوامر | 546 | 17 | 58 | 471 |
| المهارات | 110 | 5 | 8 | 97 |
| المسارات | 60 | 5 | 9 | 46 |

إذًا الأرقام الفعلية ليست 500/100/50 بالضبط؛ هي 546/110/60، والمنفذ الحقيقي أقل بكثير من الإجمالي. هذا ليس خطأ في العد، بل دليل أن الكتالوج توسع بزيادات إضافية بينما بقيت معظم العناصر خططًا أو كتالوجًا.

### حالة التشغيل الفعلية

- `companion_devices`: 0
- `companion_commands`: 0
- `companion_events`: 0
- `scheduled_jobs`: 0
- `conversations`: 0
- `messages`: 0
- `models`: 2
- `integrations`: 3

هذا يعني أن قاعدة البيانات جاهزة هيكليًا، لكن لا يوجد هاتف مقترن حاليًا، ولا أوامر هاتف حية، ولا محادثات أو مهام مجدولة مسجلة في مشروع الإنتاج الذي تم فحصه.

### سياسات RLS

سياسات المالك موجودة لجداول Companion والمحادثات والرسائل والمهام المجدولة، والقراءة للكتالوج متاحة للمستخدمين authenticated. لا ينبغي فتح هذه الجداول للـanon؛ الاقتران يجب أن يتم بعد تسجيل دخول المستخدم.

### انجراف migrations

Supabase يحتوي migration باسم `media_dev_publish_capabilities` مطبق في الإنتاج، لكنه غير موجود في نسخة Git المحلية الحالية. هذا انجراف بين سجل قاعدة البيانات والمستودع ويجب استرداد ملف migration الأصلي أو توثيق SQL الخاص به قبل اعتباره متزامنًا بالكامل. لم يتم اختراع ملف بديل لأن ذلك قد يغيّر قاعدة الإنتاج بشكل خاطئ.

## 3. Cloudflare

### الحالة قبل التدقيق

الاسم الذي كان يُفحص سابقًا `abanoubai-gateway` غير موجود في الحساب، لذلك أعطى الفحص السابق نتيجة خاطئة عن عدم وجود Worker.

### الحالة بعد التدقيق والإصلاح

تم نشر الـWorker الموجود فعليًا في المستودع باسم:

`abanoubai-local-first-scheduler`

الرابط:

https://abanoupai-local-first-scheduler.abanoupai.workers.dev

الإصدار المنشور:

`c62794b6-6d68-4c63-9073-2d6af2ee002d`

الـCron:

`0 3 * * *`

الاختبارات الخارجية:

- `GET /` أعاد HTTP 200 ورسالة الجاهزية.
- `POST /ai/chat` بدون مصادقة أعاد HTTP 401، أي أن الحماية تعمل.
- السر الموجود في Worker هو `AI_GATEWAY_TOKEN`.
- `SUPABASE_SERVICE_ROLE_KEY` غير موجود ضمن أسرار Worker.

### العائق السحابي المتبقي

مسار Cron يحتاج `SUPABASE_SERVICE_ROLE_KEY` لكي يقرأ ويحدّث `scheduled_jobs`. بدون هذا السر، الـWorker منشور ومسار AI محمي، لكن المجدول لا يمكن اعتباره فعالًا بالكامل. لا يمكن استنتاج أو اختراع service-role key من publishable key، ولا ينبغي وضعه في Git أو APK.

## 4. التطبيق وAPK

الإصدار المفحوص هو Android Companion 0.8.4، الحزمة `com.abanoubai.companion`، المعمارية `arm64-v8a`، ويحتوي `assets/models/qwen.gguf` بحجم يقارب 469 MB. APK مبني Release وموقّع v2.

اختبارات الكود والبناء نجحت:

- TypeScript/typecheck.
- Web build.
- Companion policy smoke test.
- Offline planner test.
- APK assembly.
- وجود النموذج داخل APK.
- التحقق من توقيع APK.

لكن لا يوجد جهاز Android فعلي متصل في جلسة التدقيق؛ لذلك لم يتم إثبات Realtime وAccessibility وForeground Service ووضع الطيران على هاتف حقيقي.

## الحكم النهائي

الحالة الصحيحة ليست "كل شيء مكتمل". الحالة هي:

- **GitHub:** سليم ومتزامن.
- **Supabase:** المشروع الصحيح حي والجداول والكتالوج موجودة، لكن بيانات التشغيل فارغة وهناك migration drift.
- **Cloudflare:** Worker منشور ويستجيب ويحمي `/ai/chat`، لكن Cron غير مكتمل بدون `SUPABASE_SERVICE_ROLE_KEY`.
- **Android:** APK 0.8.4 قابل للتثبيت ومضمّن معه Qwen، لكنه لم يُختبر على هاتف حقيقي.
- **الكتالوج:** 546 أمرًا و110 مهارات و60 مسارًا، وليس 500/100/50 بالضبط؛ المنفذ فعليًا 17/5/5.

لذلك المشروع **Release Candidate متكاملة البنية** وليس Stable 1.0 مثبتًا ميدانيًا. لا توجد مشكلة تمنع تثبيت APK، لكن هناك ثلاث نقاط تمنع وصف النظام بأنه يعمل بالكامل: هاتف فعلي غير مختبر، مفتاح Supabase service-role مفقود من Cloudflare، وmigration غير موجود محليًا رغم تطبيقه في الإنتاج.
