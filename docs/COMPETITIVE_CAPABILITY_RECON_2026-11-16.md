# خريطة قدرات المنافسين — AbanoubAI
**تاريخ البحث:** 16 نوفمبر 2026  
**النطاق:** مراجعة وثائق عامة رسمية فقط؛ ليست اختبارًا عمليًا للحسابات أو مقارنة أداء.  
**الهدف:** استخراج أنماط عمل مفيدة لبناء منتج أصلي، لا نسخ منتجات أو شيفرات أو علامات تجارية.

## قواعد البحث والتنفيذ
- ندرس السلوكيات والقدرات المعلنة من الوثائق الرسمية وصفحات الإصدارات.
- لا ننسخ المصدر أو الأصول أو النصوص أو الواجهات المحمية أو العلامات التجارية أو الـprivate APIs.
- لا نسجل ميزة على أنها موجودة في AbanoubAI إلا بعد تنفيذها واختبارها.
- نميز بين إعلان رسمي، قدرة موثقة، قدرة تجريبية، واستنتاج غير مختبر.
- التكاليف وحدود الاستخدام تختلف حسب الخطة والمنطقة والحساب؛ لا توجد أرقام ثابتة موثقة في هذا الملخص.

## مصفوفة القدرات العامة

| المنتج | ما تؤكده المصادر الرسمية | النضج/القيود المعروفة | الدرس لـAbanoubAI | قرار أولي |
|---|---|---|---|---|
| ChatGPT Work + Projects | Work للأعمال متعددة الخطوات والبحث والتحليل والعمل على الملفات والتطبيقات المتصلة وإنتاج مخرجات؛ المهام المجدولة؛ Projects تجمع المحادثات والملفات والتعليمات والسياق | الإتاحة مرتبطة بالخطة والطرح؛ وثيقة Agent mode تشير إلى استبداله بـWork، فلا نبني على وضع قديم | فصل المحادثة السريعة عن التنفيذ طويل الأمد؛ سياق مشروع قابل للاستمرار؛ نتائج قابلة للمراجعة | بناء مساحة مشاريع/مهام أصلية؛ دراسة التكاملات الرسمية لاحقًا |
| Claude | مشاريع وسياق، Skills قابلة لإعادة الاستخدام، Connectors/MCP، مهام مجدولة، مخرجات Artifacts؛ Browser/Computer use | Computer use موصوف بأنه Beta في صفحة المنتج؛ الصلاحيات والاشتراكات والاتصال تحدد ما يمكن فعله | Skills بعقود واضحة؛ عرض خطة العمل؛ قابلية مراجعة المخرجات والتحكم في التنفيذ | بناء سجل مهارات typed؛ تجربة MCP محدودة؛ تأجيل computer use العام |
| Manus | Browser/operator، Cloud Computer مستمر، Skills، مهام متكررة، connectors وMCP وواجهات API مخصصة | بعض خصائص الحاسوب السحابي مرتبطة بالخطة والموارد؛ نطاق كل Connector يعتمد على الموافقات | فصل بيئة التنفيذ عن واجهة المحادثة؛ ملفات ومهام قابلة للاستئناف؛ توصيل الأدوات بنطاقات صريحة | تجربة job runner مع checkpoints؛ لا نبني حاسوبًا سحابيًا خاصًا الآن |
| Microsoft Copilot | Connectors لاسترجاع معلومات من مصادر مؤسسية، إجابات متعددة الخطوات مع روابط/مصادر؛ Agents بأنواع declarative وcustom-engine؛ Pages قابلة للتحرير والتعاون | بعض التجارب مقيدة بترخيص/إدارة المؤسسة؛ الموصلات read-only افتراضيًا ما لم تُضف action connectors؛ الصلاحيات تتبع صلاحيات المصدر | لا بد من احترام صلاحيات المصدر؛ صفحات عمل دائمة قابلة للتحرير؛ فصل الاسترجاع عن الأفعال | بناء source attribution وpermissions؛ Pages-like artifacts أصلية لاحقًا |

## مصادر رسمية وتواريخها
1. OpenAI — ChatGPT Work announcement, 9 July 2026: https://help.openai.com/en/articles/11391654-chatgpt-team-release-notes
2. OpenAI — Projects, updated 14 November 2026: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
3. OpenAI — ChatGPT agent transition page, updated around late October 2026; page states Agent mode is no longer available and directs users to Work: https://help.openai.com/en/articles/11752874-chatgpt-agent
4. Anthropic — Claude product overview: https://claude.com/product/overview
5. Manus — Features overview: https://manus.im/features
6. Manus — Connectors and MCP: https://www.manus.im/features/connectors
7. Manus — Cloud Computer: https://www.manus.im/features/cloud-computer
8. Microsoft Learn — Copilot connectors overview: https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/overview
9. Microsoft Support — Copilot Pages: https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-microsoft-365-copilot-pages
10. Microsoft Learn — Microsoft 365 agent types: https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/m365-agents-faq

## ما لم يتم إثباته
- لم ننشئ حسابات اختبار أو نختبر workflows داخل هذه المنتجات.
- لم نتحقق من الأسعار أو حدود الاستخدام الخاصة بحساب المستخدم.
- لم نقس دقة المهام أو latency أو معدل الأخطاء لأي منافس.
- لا توجد مقارنة benchmark أو ادعاء تفوق.
- لا تعني الوثائق العامة أن كل الخصائص متاحة في مصر أو على كل خطة أو جهاز.

## فرص AbanoubAI وترتيبها

| الأولوية | الفرصة | القرار | معيار القبول |
|---|---|---|---|
| P0 | واجهة واحدة متسقة بين Web وAndroid Native مع نفس حساب المستخدم وبياناته | بناء أصلي | نفس المستخدم يرى نفس المهمة ويعدلها من العميلين، مع اختبار cross-user isolation |
| P0 | Auth موحد ودورة جلسة صحيحة | بناء/دمج رسمي | إثبات issuer الفعلي؛ login/refresh/logout يعمل على العميلين |
| P0 | تنفيذ المهمة بخطة وخطوات وحالة ونتيجة قابلة للتحقق | بناء أصلي | لا تظهر المهمة مكتملة إلا بعد تحقق أداة أو حالة backend |
| P1 | مشاريع وسياق مستمر وذاكرة قابلة للفحص والتصحيح والتصدير والحذف | بناء أصلي | المستخدم يرى مصدر كل ذكرى ويصححها أو يصدرها أو يحذفها |
| P1 | Typed Skills وMCP connectors مع scopes وسجل تدقيق | دمج تدريجي | كل أداة لها schema وإصدار وصلاحية وtimeout/idempotency واختبار |
| P1 | Artifacts: مخرجات قابلة للتحرير مثل تقارير وخطط وجداول | بناء أصلي | يمكن فتح المخرج وتعديله وحفظه وربطه بالمهمة |
| P2 | مهام طويلة الأمد وعمليات متكررة مع checkpoints وcancel/retry | تجربة مضبوطة | استئناف بعد انقطاع الشبكة دون تكرار أثر جانبي |
| P2 | Browser/computer use | تأجيل | لا يبدأ إلا مع sandbox وموافقة واضحة ونطاقات محددة وتسجيل/إيقاف/تراجع |
| P2 | Parallel agents / wide research | تجربة بعد القياس | جودة أفضل من التنفيذ المفرد بعد احتساب الكلفة والوقت والفشل |

## التميّز المقترح
الفرصة المدعومة حاليًا ليست تقليد واجهات أربع شركات؛ بل جمع:
- تجربة عربية أولًا صحيحة في RTL، مع الإنجليزية.
- تطبيق Android أصلي لا يفتح الموقع، وWeb مستقل.
- نفس الهوية والمهام والذاكرة عبر العميلين.
- تنفيذ يمكن تتبعه والتحقق منه، مع صلاحيات محدودة ومراجعة للأفعال الحساسة.
- أداء وتكلفة يمكن قياسهما بدل وعود عامة.

## سيناريوهات التحقق القادمة
1. مهمة عربية: أنشئ خطة دراسة أسبوعية، اعرضها للمراجعة، ثم احفظها كسجل مهام.
2. مهمة ثنائية العميل: أنشئ مهمة من Web، افتح Android بنفس الحساب، تحقق من ظهورها؛ عدّلها من Android وتحقق من عودتها إلى Web.
3. استعادة: اقطع الاتصال أثناء القراءة، أعد الاتصال، وتحقق من refetch دون تكرار الكتابة.
4. Connector: استرجع ملفًا من مصدر موصول بصلاحية قراءة فقط، وأظهر رابط المصدر.
5. إجراء حساس: جهز مسودة فقط، ولا ترسل أو تنشر دون موافقة صريحة.

**الحالة:** بحث مكتبي أولي موثق؛ لا توجد ميزة منافس تم تبنيها أو تنفيذها أو اختبارها في التطبيق نتيجة هذا المستند.


## 2026-11-18 — daily market scan and forecast ledger

### Confirmed changes from primary sources

| Product | Public evidence (date) | Capability and maturity | Constraints / confidence | AbanoubAI decision |
|---|---|---|---|---|
| Perplexity Computer Multiagent | [Introducing Computer's Multiagent effort level — 17 Nov 2026](https://www.perplexity.ai/en-GB/hub/blog/introducing-computer-multiagent) | New web effort level: a lead agent coordinates up to 16 supporting agents, lets them share findings and review one another, and returns one consolidated result. | Officially available to Perplexity Max subscribers on the web; not evidence of Android availability or independently measured quality. | **Defer** until durable jobs, budgets, checkpoints, cancellation and verification exist. Reuse the pattern of visible delegation and cross-checking, not the 16-agent count. |
| Perplexity Orchestrator API | [Orchestrator: one API for reliable inference — 17 Nov 2026](https://www.perplexity.ai/en-GB/hub/blog/orchestrator-one-api-for-reliable-inference) | One API exposes open-weight and proprietary models, unified billing, same-model provider failover and task routes; automatic model routing is marked preview. | Provider claims about higher success rates are vendor measurements, not an independent benchmark. Uses prepaid API credits and adds provider/billing dependency. | **Prototype later** behind the provider-neutral adapter; compare against direct provider calls on the same Arabic/English task set before integration. |
| Perplexity Context API | [Context API extracts full context from any web page — 17 Nov 2026](https://www.perplexity.ai/en-GB/hub/blog/context-api-extracts-full-context-from-any-web-page) | Reads up to 10 URLs and returns clean Markdown/HTML, links, query-relevant snippets, metadata, freshness and per-URL status. | Provider states USD 1 per 1,000 URLs fetched; validate regional availability, terms, retention and actual quality before use. Vendor evaluation is not independent. | **Experiment later** for source-grounded research; keep retrieval provider replaceable and preserve source URL/fetch time/status. |
| Perplexity Monitor API | [Introducing Perplexity's Monitor API — 16 Nov 2026](https://www.perplexity.ai/en-GB/hub/blog/introducing-perplexitys-monitor-api) | Scheduled topic/page monitoring, change diffs, deduplication, confidence scores and signed webhooks. | Provider states USD 1 per 1,000 successful runs or page URLs fetched. It adds a third-party scheduled service and webhook attack surface. | **Defer** until AbanoubAI has a durable event/job runtime, signature verification, replay protection and spend caps. |

The same scan checked current official OpenAI, Anthropic, Google, Microsoft and Manus product pages. No additional new feature in the 17–18 Nov window was confirmed strongly enough to record as a product change. Previously documented capabilities remain claims/docs, not tested workflows. The Perplexity material above is a vendor announcement; it is not proof that its benchmarks generalize to AbanoubAI.

### Comparative insight

The strongest pattern is not “more agents”. It is the combination of (a) a lead planner, (b) typed parallel work, (c) shared evidence, (d) explicit cross-checking, (e) provider failover, and (f) persistent monitoring with deduplicated events. AbanoubAI should build the trust boundary and job lifecycle first. A smaller number of specialists with measurable task contracts is preferable to an unbounded agent swarm.

### Opportunity backlog update

| Rank | Opportunity | Impact / confidence | Effort / risk | Decision and acceptance criterion |
|---|---|---|---|---|
| 1 | Enforce server-side AI/action flags and owner-scoped service-role reads | Very high impact; high confidence from deployed source inspection | Medium effort; high security sensitivity | Implement in Draft PR #35. Pass tests proving kill switch + capability flag are both required, all service-role reads inject the authenticated owner, and cross-user filters are rejected. Do not deploy until review. |
| 2 | Prove the actual Web Supabase Auth issuer | Very high impact; high confidence that source alone is insufficient | Low effort if project ref is supplied; blocked on non-secret configuration evidence | Compare the Web project's actual Supabase URL/issuer with Android configuration; do not wire Android Auth before exact match. |
| 3 | Complete native route parity and one shared authenticated data workflow | Very high impact; high confidence | High effort; depends on Auth and PR reconciliation | Same user-owned record can be created/read/updated in both clients; prove isolation, reconnect and conflict handling. |
| 4 | Monitor API prototype for public release/change tracking | Medium-high potential; medium confidence | Medium effort; requires durable jobs, webhook signing and budget controls | Track 10 public official changelog pages; verify signatures, deduplicate events and measure false positives before any action is triggered. |
| 5 | Orchestrator adapter benchmark | Medium potential; medium confidence | Medium effort; adds provider and billing dependency | Compare direct providers vs one aggregator on the same Arabic/English golden set; record quality, p50/p95, cost per successful task, failure and privacy handling. |

### Forecast ledger (hypotheses, not roadmap facts)

| Horizon | Hypothesis | Signals | Confidence | Disconfirming evidence / trigger to revise | Preparation now |
|---|---|---|---|---|---|
| 30 days | More model platforms will expose unified inference, routing or same-model failover APIs. | Perplexity Orchestrator announcement and current model/provider churn. | Medium | Few additional stable APIs, or aggregators add cost/latency without measurable reliability gain. | Keep adapters provider-neutral; build a reproducible routing benchmark, but leave routing disabled. |
| 90 days | Web monitoring will increasingly arrive as managed APIs with signed webhooks and built-in deduplication. | Perplexity Monitor API and recurring changelog-monitoring needs. | Medium | Pricing, rate limits or webhook reliability make self-hosted polling cheaper and simpler. | Prepare an event envelope with source, fetched-at, signature, dedupe key and review state. |
| 180 days | Complex assistants will make multi-model collaboration and shared artifacts more visible to users. | Multiagent workspaces and orchestration APIs. | Medium | Users prefer single-agent workflows because coordination overhead exceeds quality gains. | Build inspectable task contracts and evidence exchange before adding parallel agents. |
| 1–2 years | Model access may become more interchangeable, making privacy, permissions, task verification and recovery stronger differentiators than model count. | Unified API formats, open-weight growth and provider failover products. | Medium-low | Provider-specific capabilities, lock-in or inference cost remain dominant. | Preserve portable memory, scoped tools, evaluation and auditable execution; avoid hard dependency on one router. |

### Phase gate

This is recurring market intelligence only. The top-10 capability study (Phase 2) has **not** started because Phase 1 P0 acceptance is still incomplete. No competitor API, agent skill, external account or write permission has been connected or activated.
