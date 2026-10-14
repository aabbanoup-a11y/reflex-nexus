# حالة AbanoubAI والوصول إلى Stable 1.0

**تاريخ التدقيق:** 2026-10-13  
**المستودع:** `aabbanoup-a11y/reflex-nexus`  
**آخر commit:** `8efed7f`

## الحكم الحالي

المشروع في حالة **Release Candidate قابلة للبناء والتثبيت**، وليس Stable 1.0 ميدانية بعد. البناء والاختبارات الأساسية ناجحة، لكن التشغيل الحقيقي مع الهاتف وقاعدة الإنتاج ما زال غير مثبت لأن Supabase لا يحتوي جهازًا مقترنًا أو أحداث تنفيذ، ولأن اختبار الهاتف عبر `adb` غير متاح في بيئة التدقيق.

## الحالة الفعلية حسب النظام

### GitHub

فرع `main` متزامن مع `origin/main` ولا توجد تعديلات محلية غير محفوظة. آخر تشغيل GitHub Actions لبناء Android على commit `8efed7f` انتهى بنجاح. فرع `ai-team` أقدم من `main` ولا يمثل النسخة الحالية.

### Supabase

مشروع الإنتاج الصحيح هو `AbanoupAi` بالمعرّف `wobfdslqlmvlatyrtgkd` وحالته `ACTIVE_HEALTHY`.

الكتالوج الفعلي في قاعدة البيانات أكبر من الأرقام الاسمية المطلوبة:

- 546 أمرًا: 17 implemented، 58 cataloged، 471 planned.
- 110 مهارات: 5 implemented، 8 cataloged، 97 planned.
- 60 مسارًا: 5 implemented، 9 cataloged، 46 planned.

إذًا الكتالوج مشترك للمحلي والسحابي، لكنه لا يعني أن 546 أمرًا أو 110 مهارات أو 60 مسارًا لها handlers مكتملة. المنفذ والمختبر فعليًا أقل من ذلك.

بيانات التشغيل الحالية كلها صفر في الجداول الأساسية:

- `companion_devices`: 0
- `companion_commands`: 0
- `companion_events`: 0
- `scheduled_jobs`: 0
- `conversations`: 0
- `messages`: 0

هذا يثبت أن المخطط موجود، لكنه لا يثبت أن هاتفًا حقيقيًا مقترن أو أن أمرًا وصل ونُفذ في الإنتاج.

يوجد migration مطبق في Supabase باسم `media_dev_publish_capabilities` وغير موجود في نسخة Git المحلية. هذا migration drift يجب حله باسترداد SQL الأصلي من مصدره قبل إضافة ملف بديل.

### Cloudflare

Worker المعلن في ملفات المشروع هو `abanoubai-local-first-scheduler` مع Cron `0 3 * * *`. مسار الصحة ومسار AI محميان في النسخة المنشورة التي تم التحقق منها سابقًا، لكن Cloudflare ما زال يحتاج `SUPABASE_SERVICE_ROLE_KEY` حتى يصبح Cron قادرًا على قراءة وتحديث `scheduled_jobs`. لا يمكن استخدام publishable key بدل service-role key.

### Android

الإصدار الحالي `0.8.4`، الحزمة `com.abanoubai.companion`، والمعمارية `arm64-v8a`. APK يحتوي نموذج Qwen الفعلي فقط:

```text
assets/models/qwen.gguf
```

تم حذف نماذج غير موجودة من قائمة الاختيار، وأصبح Gradle يرفض اسم نموذج غير مدعوم بدل إنتاج APK يشير إلى ملف مفقود.

الفحوصات الحالية الناجحة:

- `test:offline-planner`
- `test:companion`
- `npm run build`
- Android Release build
- APK v2 signature verification
- وجود Qwen داخل APK
- GitHub Actions Android على `8efed7f`

## رابط APK الحالي

[تحميل AbanoubAI Companion 0.8.4](https://files.manuscdn.com/user_upload_by_module/session_file/310519664011289695/IvjPjeOylxYJDBzO.apk)

SHA-256:

```text
393ee043f8a35639d93d35709b1aa308effb6571d020588be3f8ff3795a5d111
```

## ما يمكن أن يعمل دون إنترنت

يعمل محليًا بعد تثبيت النموذج والصلاحيات: فتح التطبيق، بعض أوامر التنقل، الكتابة والضغط، قراءة الشاشة، اللقطات، الملاحظات، التخطيط المحلي، التحقق من خطة JSON، تنفيذ الخطوات المدعومة، والعودة إلى المحادثة.

لا تعمل دون إنترنت: Supabase Realtime، Cloudflare، البحث، المواقع والخدمات الخارجية، GitHub، النشر، والمزامنة. النموذج المحلي لا يجعل المهام السحابية أو المواقع تعمل دون اتصال.

## ما يلزم قبل Stable 1.0

1. إقران هاتف فعلي وتسجيل صف في `companion_devices`.
2. اختبار Accessibility وForeground Service وNotification Access والبطارية على الهاتف الفعلي.
3. تنفيذ ستة سيناريوهات ميدانية: فتح تطبيق، كتابة ملاحظة، بحث في YouTube، قراءة الشاشة، خطة متعددة الخطوات، وفشل آمن.
4. تسجيل `companion_commands` و`companion_events` والتحقق من نتيجة كل خطوة، وليس رسالة نجاح فقط.
5. إدخال Service Role key الصحيح في Cloudflare من قناة آمنة، ثم تشغيل Cron تجريبي على مهمة غير حساسة.
6. استرداد migration `media_dev_publish_capabilities` وإضافته إلى Git دون اختراع SQL.
7. تحديث حالات الكتالوج فقط بعد وجود handler واختبار ونتيجة موثقة.
8. إبقاء الإرسال والحذف والدفع والنشر وتغيير الصلاحيات تحت تأكيد صريح؛ لا يجوز تنفيذها تلقائيًا لمجرد أن النموذج استنتجها.

## ما تعلمناه من المنافسين

المنافسون لا يثبتون وكيلًا واحدًا يسيطر على كل الهاتف والكمبيوتر ويعمل بالكامل دون إنترنت. Google تفرق بين مهام Android المحدودة وGemini Nano المحلي وأدوات API والمتصفح، وOpenAI تفرق بين Work وCloud Browser والعمل المحلي، بينما Anthropic تفرق بين Browser Use وComputer Use وتطلب منفذًا يملكه التطبيق. Perplexity تفرق بين Comet المتخصص في المتصفح وComputer كمنتج مستقل، وMicrosoft تفرق بين Cowork وBrowse with Copilot وComputer Use، وRabbit تفرق بين OS3 السحابي والعامل المحلي الموصول.

النمط المشترك الذي يجب اعتماده في AbanoubAI هو:

- عقد typed للأدوات، بحيث يقترح النموذج الأداة ولا ينفذ كودًا حرًا.
- أقل صلاحية لازمة لكل تطبيق أو خدمة أو موقع.
- فصل القراءة عن الكتابة.
- تأكيد قبل الإرسال والحذف والشراء والنشر ومشاركة البيانات.
- عرض الخطة والتقدم وإمكانية الإيقاف والتولي البشري.
- تحقق بعد كل خطوة من الشاشة أو API أو حالة الملف.
- معاملة الويب والملفات والإشعارات كبيانات غير موثوقة قد تحتوي Prompt Injection.
- استخدام API أولًا، ثم Browser/Computer Use كحل احتياطي داخل بيئة معزولة.
- إعلان واضح لمكان التنفيذ: محلي أو سحابي، وما الذي سيغادر الهاتف.

## قرار التوسع

بعد إغلاق بوابة Stable 1.0، يتم توسيع الأوامر والمهارات والمسارات على دفعات مجالّية، وليس بتغيير الحالة إلى implemented دفعة واحدة. كل عنصر جديد يجب أن يملك handler أو موصلًا، schema، سياسة صلاحيات، تحققًا بعد التنفيذ، واختبارًا. بهذا تصبح أرقام 500 و100 و50 خريطة قدرات حقيقية بدل قائمة أسماء.

## References

[1]: https://developer.android.com/ai/gemini-nano "Gemini Nano على Android"
[2]: https://ai.google.dev/gemini-api/docs/function-calling "Gemini function calling"
[3]: https://ai.google.dev/gemini-api/docs/computer-use "Gemini computer use"
[4]: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex "ChatGPT Work"
[5]: https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt "ChatGPT Cloud Browser"
[6]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool "Anthropic Computer Use"
[7]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-tool "Anthropic Browser Use"
[8]: https://www.perplexity.ai/help-center/comet/en/articles/12875447-comet-for-android-quick-start-and-key-features "Comet for Android"
[9]: https://www.perplexity.ai/help-center/en/articles/13531023-managing-comet-assistant-permissions "Comet permissions"
[10]: https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use "Microsoft Computer Use"
[11]: https://support.microsoft.com/en-us/microsoft-365-copilot/cowork-take-control-actions "Microsoft Cowork actions"
[12]: https://www.rabbit.tech/updates "Rabbit OS3 updates"
[13]: https://www.rabbit.tech/terms-of-use "Rabbit terms and limitations"


## تحديث تدقيق 2026-10-14

- تشغيل `AbanoubAI Self Maintenance` على GitHub نجح بالكامل على commit `51653ca` بعد إصلاح عدم تطابق `package-lock.json` مع `package.json`.
- `npm ci` يعمل الآن في بيئة نظيفة.
- `self-diagnostic` أعاد `healthy-source` دون إخفاقات.
- اختبارات `offline-planner` و`companion` وبناء الويب نجحت.
- ESLint أصبح يخرج بلا أخطاء، مع 59 تحذيرًا فقط من استخدام `any` وبعض قواعد Fast Refresh وReact Hooks القديمة. هذه ليست أخطاء بناء، لكنها ديون تقنية يجب تقليلها تدريجيًا.
- أحدث Android Actions الناجحة تضمنت بناء Companion، بينما التشغيل الفاشل الأقدم ليس آخر حالة.

### تحديثات المنافسين

في 8 أكتوبر 2026 أعلنت Google Gemini agent كوكيل عمل موحدًا بذاكرة ومهارات وأدوات ووصلات وتشغيل مستمر وتنسيق وكلاء فرعيين، مع ضوابط هوية وصلاحيات وعزل وتكلفة. هذا يؤكد أن مسار AbanoubAI الصحيح هو فصل الوكيل عن النموذج وإدارة manifest للمهارات والأدوات، لا إضافة أسماء نماذج فقط. [14]

توثيق Google Computer Use الحالي يصف حلقة صريحة: النموذج يقترح فعل واجهة، التطبيق ينفذه، ثم يرسل لقطة الحالة الجديدة. كما يميز بين السماح وطلب التأكيد والمنع، ويدعم كشف Prompt Injection اختياريًا. هذه الآلية يجب أن تكون أساس المسارات السحابية المرئية في AbanoubAI. [15]

توثيق Android المحدث في 8 أكتوبر يثبت أن Gemini Nano/AICore مناسب لمهام محلية مثل Prompt والتلخيص والتدقيق وإعادة الصياغة ووصف الصور والتعرف على الكلام، لكنه يذكر حدود الرموز والجهاز والقدرة، ويوصي بالاستدلال الهجين عند تعذر المحلي. هذا لا يثبت أن الوكيل السحابي يعمل دون شبكة. [16]

توثيق Anthropic الحالي يعلن Computer Use كـGA في toolset أحدث، لكنه يطلب بيئة يملكها التطبيق، وعزلًا وصلاحيات قليلة وقائمة نطاقات وموافقة بشرية للأفعال المؤثرة. كما يوضح أن Browser Use أنسب للمهام المحصورة في الويب. [17]

[14]: https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026 "إعلان Gemini agent في Google Cloud"
[15]: https://ai.google.dev/gemini-api/docs/generate-content/computer-use "توثيق Google Computer Use"
[16]: https://developer.android.com/ai/gemini-nano "توثيق Gemini Nano وAICore"
[17]: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool "توثيق Anthropic Computer Use"
