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


---

## Market watch — 2026-11-19 (ongoing Phase-1 radar, not the ten-product study)

### Confirmed changes

| Product / platform | Evidence and maturity | Strongest observed capability | Limitation / caveat | AbanoubAI decision |
|---|---|---|---|---|
| ChatGPT | Official release notes, 18–19 Nov 2026; rollout | Live Dictation now streams transcription across Android/web and has no 10-minute recording cap. Health Connect integration is rolling out to Android. | Health rollout is gradual and US-only; GPT-6.2 Astra/Sol remain Work/Codex desktop preview. No independent Arabic transcription benchmark was run. | Prototype an Arabic-first voice composer with editable transcript and explicit send; benchmark before provider selection. Defer Health integration. |
| Gemini 4 Neon | Google announcement, 18 Nov 2026; API and paid product rollout | Google presents it as a long-context model for multi-step work, with 1M context and published API pricing. | Performance rankings and task-completion claims are vendor-reported; no AbanoubAI golden-task comparison exists. | Add to provider benchmark candidates; no default-router change. |
| Microsoft 365 Copilot Skills | Microsoft Learn, Nov 2026; GA in Copilot Chat | Reusable task instructions with optional resources/scripts; manifest 1.9 supports Agent Skills directories. | Enterprise package governance and tenant availability still matter; portability does not imply identical runtime behavior. | Design a provider-neutral skill manifest with pinned versions and permission declarations; do not install or activate skills yet. |
| Android AppFunctions | Android Developers, current documentation; Experimental Preview | Apps can expose typed on-device functions as MCP-like capabilities to authorized agents. | Android 16+, experimental API, EXECUTE_APP_FUNCTIONS permission and Connected Apps preview requirements. | Keep an optional adapter seam in native architecture; defer implementation until API maturity/device eligibility are proven. |

### Comparative insight

The market is converging on three connected layers: (1) richer multimodal/voice capture, (2) reusable skills or tool manifests, and (3) explicit operating-system/app capability surfaces. These are not interchangeable: MCP standardizes tool communication, skill manifests describe reusable behavior, and Android AppFunctions expose narrowly declared app capabilities. AbanoubAI should keep these layers separate.

### Opportunity backlog update

1. **Arabic voice capture with proof before submission** — Impact: high; evidence: medium; effort: medium; risk: low-to-medium. Acceptance: Arabic/Egyptian Arabic + English mixed speech benchmark, editable transcript, no auto-send, and measurable word-error/task-completion improvement over current text entry. Kill if transcription quality or latency is worse than typed input for target tasks.
2. **Portable, default-deny skill manifest** — Impact: high; evidence: medium; effort: medium; risk: high. Acceptance: each skill pins version/dependencies, declares data/tool scopes, has expiry and budget, passes static scan and sandbox tests, and cannot widen a parent agent's permissions. Keep disabled pending explicit Phase-3 approval.
3. **Android AppFunctions adapter experiment** — Impact: medium-high; evidence: high for API existence, low for ecosystem maturity; effort: medium; risk: medium. Acceptance: one harmless user-owned task capability on a confirmed Android 16+ test device, discovered only by an authorized caller, with user-visible invocation and audit. Defer on older devices or if preview stability is insufficient.

### Forecast ledger

- **30 days — voice becomes a standard assistant input surface.** Signals: OpenAI's global Live Dictation rollout and mobile integrations. Confidence: medium. Alternative: feature adoption may remain limited by privacy, language accuracy and device UX. Trigger: at least two major assistants ship comparable streaming transcription to Android. Preparation: editable transcript component and Arabic evaluation set.
- **90 days — skill manifests and tool permissions become more standardized.** Signals: Copilot Chat Skills GA, Agent Skills support in manifest 1.9, OWASP Agentic Skills Top 10 governance guidance. Confidence: medium. Alternative: vendors may keep incompatible private formats. Trigger: two additional major ecosystems publish stable, interoperable manifests. Preparation: provider-neutral manifest and policy engine, without activation.
- **180 days — Android app-function exposure grows but remains OS/permission gated.** Signals: AppFunctions preview and MCP alignment. Confidence: low-to-medium. Alternative: API may remain preview or be restricted to selected assistants. Trigger: stable AndroidX release and broader device/assistant availability. Preparation: typed native adapter boundary only.
- **1–2 years — personal agents combine cloud orchestration with local app capabilities.** Confidence: low-to-medium; this is an architectural hypothesis, not a roadmap claim. Downside case: Android or vendors restrict third-party invocation. Robust choice: keep local actions user-triggered, narrow, replaceable, and independent of cloud model availability.

### Scenario plan

- **Base:** cloud models remain the main reasoning layer; portable contracts and server-side verification provide most value.
- **Upside:** local models and Android AppFunctions become practical; add opt-in local adapters behind the same typed capability interface.
- **Downside:** OS restrictions or provider cost/availability limit automation; retain manual handoff, offline planning, and user-controlled reminders.
- **Robust across all cases:** shared user-owned data, explicit scopes, observable execution, cancellation/recovery, and a replaceable provider router.

This watch entry is a recurring market scan only. It does **not** start Phase 2's ten-product capability study, does not claim feature parity, and does not authorize Phase 3 permissions.


---

## Market scan update — 2026-11-20

Scope: public product documentation and release notes only. No competitor account workflows were run, so every capability below is marked **discovered / not independently tested**. Vendor performance claims are not treated as benchmark results.

### Dated capability matrix

| Product / project | Capability and evidence | Maturity / availability | Technical approach / dependencies | User value | Cost, privacy, lock-in and limits | AbanoubAI decision | Acceptance test |
|---|---|---|---|---|---|---|---|
| OpenAI ChatGPT | Live Dictation displays transcript while speaking; 10-minute limit removed. [Release notes, 2026-11-18](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) | Rolling out globally to plans on Android, iOS, web and desktop | Streaming speech-to-text in the client composition flow | Faster capture and immediate correction | Provider/client availability; no AbanoubAI latency or Arabic accuracy evidence | **Prototype later**: editable Arabic transcript, no auto-send | 100 Arabic/Egyptian Arabic + mixed Arabic-English prompts; compare WER, correction time, task completion and latency against typing |
| OpenAI ChatGPT mobile | New mobile navigation with Dots tab and pinned tools. [Release notes, 2026-11-19](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) | Gradual rollout; Dots tab initially limited to Pro users aged 18+ in supported regions | App-level navigation and cloud-agent surface | Faster access to persistent work | Limited eligibility and region/plan rollout; not a general availability claim | **Observe only**; keep one Home plus adaptive drawer as the approved AbanoubAI IA | Test whether one Home and drawer make the top five daily tasks discoverable within two taps on a compact Android device |
| Google Gemini 4 Neon | New model for complex coding, analytical and knowledge workflows; vendor reports 1M context and benchmark results. [Google announcement, 2026-11-18](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/) | Announced and rolling out to paid API / selected consumer and business tiers | Hosted model API and Google AI Studio / Gemini surfaces | Potentially useful long-context and multi-step reasoning | Published API price: $3/M input, $15/M output; cached input $0.15/M; vendor benchmark claims require independent validation; hosted data processing and provider lock-in | **Benchmark candidate only**; do not set as default | Same Arabic/English golden tasks as existing providers; measure task success, tool correctness, p50/p95, retries and cost per successful task |
| Perplexity Teammates | Persistent project agents retain goals, task history and shared files, coordinate Computer sessions and other teammates, monitor work and return results for review. [Official announcement](https://www.perplexity.ai/hub/blog/teammates-are-agents-for-complex-ongoing-work) | Initial web launch for Max subscribers; iOS described as coming soon | Built on Computer, Projects, skills, memory, plugins and separate execution environments | Ongoing work with continuity and delegation | Web-first rollout and paid access; existing Computer scopes govern connected tools; vendor-managed environments | **Adopt workflow pattern, not service**: durable job owner, visible checkpoints and review handoff | A 24-hour harmless research job must resume after worker restart, preserve task history, expose checkpoints and never perform unapproved external writes |
| Mistral Managed Agents | Agents can run for hours/days, resume after crash, pause for approval and resume, and emit model/tool traces. [Mistral release notes, 2026-11-05](https://docs.mistral.ai/resources/release-notes) | Public Preview; Mistral-hosted option, with local/self-hosted development path | Python Agents SDK; run in process, self-hosted worker or Mistral-managed runtime | Durable execution and observability without building all orchestration infrastructure | Hosted sessions create provider lock-in; price not published in reviewed release notes; default trace redaction is vendor-described and needs verification | **Controlled architecture comparison** against Cloudflare Workflows; no provider adoption | Run identical retry/restart/cancel/approval scenario in both designs; compare recovery correctness, trace completeness, privacy boundary and total cost |
| Cursor Agents / CLI | Sandbox symlink-write protections, credential revocation stopping active cloud agents, and improved computer-use screenshot alignment. [Cursor release notes, 2026-11-17](https://prod.cursor.com/docs/release-notes) | Shipped product updates; some controls are team/admin scoped | Sandboxed workers, team policy hooks, credential lifecycle and audit controls | Reduces agent boundary escapes and stale-credential execution | Team/network controls may require managed plans; coding-focused rather than a personal OS | **Build native controls**: revoke-on-expiry, sandbox boundaries and auditable tool credentials | Revoke a test credential during a harmless running job; verify next action is denied and audit event is recorded without leaking the credential |
| Android AppFunctions | Jetpack AppFunctions 1.0.0-beta01 and experimental dynamic registration/access-level APIs. [AndroidX release notes](https://developer.android.com/jetpack/androidx/releases/appfunctions) | Beta / experimental APIs; not a stable universal assistant integration | App-owned typed function declarations and Android system-mediated execution | Narrow native capabilities without general screen automation | OS version, assistant eligibility, permission and ecosystem constraints; exact device support must be verified | **Defer runtime adoption**; preserve a small adapter seam only | On a confirmed eligible Android 16+ device, expose one harmless app-owned read capability with user-visible invocation and audit; otherwise remain on explicit in-app actions |
| Android Compose Material 3 | Material 3 1.5.0 stable, dated 2026-11-18. [AndroidX release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3) | Stable 1.5.0; 1.6.0-alpha01 also listed | Native Compose components and theme system | More current native UI primitives and accessibility improvements | Upgrade may require dependency and visual regression review; avoid mixing stable and alpha navigation packages | **Evaluate stable upgrade** after PR #32 is reconciled; do not introduce alpha navigation solely for novelty | Build compact/expanded screens, RTL/LTR, dark/light and TalkBack tests before/after; no regression in drawer-only navigation |
| OWASP GenAI Security Project | 2026 LLM Top 10 and Agent Control Standard announced. [OWASP announcement, 2026-09-01](https://genai.owasp.org/2026/09/01/owasp-genai-security-project-unveils-2026-top-10-for-llm-applications-new-agent-control-standard-and-sponsors-as-community-tops-30000-members/) | Published security guidance; standards maturity and versioning must be checked before normative adoption | Runtime controls, identity, permission governance and security verification | Converts agent security principles into testable control requirements | Mapping effort; community standard is not proof that an implementation is secure | **Map selectively** to current policy engine and CI; no branding-only adoption | Every selected control must map to code owner, threat, test and audit evidence; reject untestable checklist items |

### Comparative insight and current gap

- Strongest new workflow pattern: Perplexity and Mistral make long-running work persistent across sessions, while Mistral documents crash recovery, approval/resume and traces. These are vendor-managed capabilities and have not been independently tested here.
- Strongest reliability/security lesson: Cursor's credential revocation and sandbox fixes show that runtime enforcement must survive model errors and mid-task permission changes.
- Strongest input/UX signal: OpenAI's Live Dictation makes transcript correction a first-class interaction. AbanoubAI's possible differentiation is Egyptian Arabic and mixed-language capture tied to a user-owned task, with explicit correction before submission.
- Model signal: Gemini 4 Neon increases pressure to benchmark long-context quality against total cost rather than choosing a model by name or leaderboard rank.
- Android signal: AppFunctions is advancing but remains beta/experimental; stable Compose Material 3 1.5.0 is a more mature near-term foundation.
- Unsolved opportunity hypothesis: a single Arabic-first execution record shared by independent Web and native Android clients, with observable evidence, ownership, cancellation and recoverable state. No comparable end-to-end workflow was verified in this scan; this is an inference, not a market-wide absence claim.

### Opportunity pipeline — updated 2026-11-20

1. **Prepare now — verified cross-client execution record.** Target workflow: start a user-owned task on Web, see the same status/evidence on native Android, reconnect after network loss and avoid duplicate execution. Impact high; evidence high for the user requirement, current implementation gap confirmed; effort high; risk medium; dependencies: verified Auth issuer, shared schema/contracts, RLS and idempotency. Acceptance: one real read/create/update task succeeds on both clients for the same owner, cross-user access is denied, reconnect refetches consistent state, and repeated request IDs do not duplicate writes. Kill/defer if identity cannot be proven.
2. **Prototype later — Arabic voice capture with correction.** Impact high; evidence medium; effort medium; privacy risk low-to-medium if audio is transient and transcript is user-reviewed. Acceptance: benchmark 100 mixed Arabic/Egyptian Arabic/English utterances, compare word error rate and completion time with typing, show editable transcript and never auto-send. Kill if accuracy or latency does not beat typed entry for the target tasks.
3. **Controlled experiment — durable workflow engine comparison.** Impact high; evidence medium; effort medium; risk medium-high due operational cost and lock-in. Compare Cloudflare Workflows with Mistral Managed Agents using identical harmless tasks. Acceptance: restart, retry, cancellation, approval pause/resume and trace audit all pass; choose only after measured cost, data residency and portability review.
4. **Defer — AppFunctions.** Impact medium; evidence high for API availability but low for third-party ecosystem readiness; effort medium; risk medium. Acceptance: stable API and a confirmed device/assistant path plus one harmless typed capability; no broad Accessibility or package visibility permissions.
5. **Build natively — revocable tool scopes.** Impact high; evidence high from current agent security guidance and Cursor changes; effort medium; risk low-to-medium. Acceptance: expiry/revocation denies the next operation, records a redacted audit event and does not affect unrelated read-only functions.

### Forecast ledger update — 2026-11-20

- **30 days / medium confidence:** managed long-running agents with approval, recovery and traces become more common. Signals: Perplexity Teammates and Mistral Managed Agents. Disconfirming evidence: previews remain gated, prices are high or APIs lack stable recovery semantics. Trigger: at least two stable documented APIs plus repeatable restart/approval tests. Preparation: provider-neutral job/checkpoint contracts.
- **90 days / low-to-medium confidence:** AppFunctions may progress toward stable release, but system/assistant/device eligibility will remain a constraint. Disconfirming evidence: no stable AndroidX release or third-party invocation remains restricted. Trigger: stable 1.0 and official device/assistant support documentation. Preparation: adapter interface only.
- **180 days / medium confidence:** streaming speech input becomes a common assistant surface; Arabic quality remains the differentiator. Disconfirming evidence: low adoption or poor Arabic recognition. Trigger: multiple Android assistants expose editable live transcripts and a reproducible Arabic benchmark. Preparation: transcript correction UI and privacy-preserving evaluation set.
- **1–2 years / medium confidence:** personal agents increasingly combine cloud orchestration with app-owned local capabilities. Base case: gradual standards convergence; upside: stable AppFunctions and practical local models; downside: OS restrictions and vendor lock-in. Robust architecture: narrow typed capabilities, consent provenance, portable memory/jobs, visible audit and manual fallback.

### Scenario plan

- **Base:** cloud inference remains useful; AbanoubAI wins through Arabic UX, shared user-owned state, verification and recovery.
- **Accelerated:** local models and AppFunctions become practical; add opt-in adapters behind the same typed capability contracts.
- **Downside:** Android restricts third-party execution and hosted inference remains costly; retain offline planning, explicit in-app actions and replaceable providers.
- **Robust across scenarios:** one verified identity, portable data, least-privilege capabilities, user-visible traces, cancellation and rollback.

This is a recurring intelligence update only. It does not begin the ten-product Phase 2 study, authorize external account connections, or enable Phase 3 permissions.


---

## Market scan — 2026-11-21

### Confirmed announcements and observed product changes

| Product | Evidence / maturity | Capability and constraints | AbanoubAI decision |
|---|---|---|---|
| ChatGPT Space | [OpenAI release notes, 20 Nov 2026](https://help.openai.com/en/articles/6825453-chatgpt-release-notes); rolling rollout | Interactive pages and presentations, shared editing, automatic refresh from connected apps/tools. Current rollout is Plus and 18+; shared access requires an eligible account and public links are unavailable. | Learn from durable, updateable artifacts; do not treat Space as available to this user or copy its interface. Build an original private task/report artifact model only after Phase 1. |
| Gemini API Tool Retrieval | [Google announcement, 19 Nov 2026](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tool-retrieval/); Preview in Interactions API | Defers full parameter schemas while exposing tool names/descriptions; fetches schemas on demand within a request. Vendor says this reduces token/context overhead and latency. It is a provider-specific preview, not a neutral standard. | Candidate experiment: provider-neutral lazy tool-schema retrieval. Keep tool registry typed and permission-filtered before retrieval; defer prototype until Phase 1/Phase 2 gate. |
| Gemini computer use for Mac | [Google announcement, 19 Nov 2026](https://blog.google/innovation-and-ai/products/gemini-app/computer-use-mac/); rollout | Mac desktop automation across files/apps/web with isolated background window, live preview, app permissions and approvals. English/U.S. rollout; Apple Silicon, macOS Sequoia and 18+ personal account requirements. | Not an Android Chrome path. Learn from visible execution and narrow app permissions; do not adopt desktop automation into Android. |
| Claude / Agent Skills | [Anthropic News](https://www.anthropic.com/news); latest relevant announcements reviewed | No new product announcement dated 20–21 Nov was verified. Agent Skills donation to the Agentic AI Foundation remains a useful interoperability signal, not a new feature this cycle. | Continue tracking the standard; no implementation or new dependency today. |
| Microsoft 365 Copilot | [Microsoft release notes](https://learn.microsoft.com/en-us/microsoft-365/copilot/release-notes); latest reviewed update 17 Nov | Learning Agent on Windows and richer mail/people/meeting data for declarative agents. Enterprise identity, licensing and source authorization remain material dependencies. | Learn from permission-respecting enterprise retrieval; defer Microsoft-specific integration. |
| Replit Missions | [Replit, published 17 Nov and updated 19 Nov 2026](https://replit.com/blog/introducing-replit-missions); launched product, but plan/region availability is not specified on the page | Cloud agent swarms plan/build/test/iterate against a mission contract; user sets a spending cap and which actions need approval; progress, blockers and awaiting-approval tasks are visible. A vendor-described AI judge checks the success criteria; budget exhaustion leaves the outcome unresolved. | Learn the mission contract, budget envelope, action-specific approval and explicit unresolved state. Do not copy the product or adopt swarms before evaluation. |
| Cursor Agent voice | [Cursor changelog, 6 Nov 2026](https://cursor.com/changelog); current release note | Realtime voice conversation with coding agents across IDE, web and iOS; it reports progress while the agent works. No Android support is listed in this release note. | Track voice interaction as an input surface only; no Android integration or provider dependency now. |
| Manus / Perplexity / smaller open-source entrants | Official release/changelog scan for the current window | No newly verified 20–21 Nov product change from Manus or Perplexity was found that alters the architecture choice. Manus's latest relevant product post remains Manus 2.0 from 28 Sep; the Nov 16 post is a foundation partnership, not a new agent capability. This is bounded public-source coverage, not proof that no changes exist. | Keep the dynamic watchlist; do not claim competitive superiority or feature parity. |

### Cross-product comparison and insight

- Artifact continuity: ChatGPT Space is extending the assistant from conversation into durable, editable, connected artifacts. The value is state that remains useful after a chat ends; the limitation is rollout, account and age eligibility.
- Mission orchestration: Replit Missions formalizes a goal, success criteria, budget and per-action approval boundary, then exposes progress and unresolved state. Its reported benchmark outcomes are vendor claims; the architectural lesson is the contract and budget boundary, not the claimed swarm speedup. An AI judge alone is insufficient for AbanoubAI: completion must still require deterministic tool/output verification.
- Tool efficiency: Gemini Tool Retrieval highlights that sending every full tool schema on every turn becomes expensive and can degrade selection as tool catalogs grow. The reusable idea is staged discovery, not dependence on a single provider's API.
- Computer use: Google’s Mac release emphasizes a separate execution surface, app-level permission choice, visible preview, pause and approval. It is desktop-only and does not solve Android's app sandbox or permission constraints.
- Enterprise grounding: Copilot's strength remains contextual access under source-system permissions. The transferable lesson is to preserve source ownership and authorization rather than copy broad connector catalogs.
- AbanoubAI opportunity hypothesis: combine Arabic-first workflows with one user-owned job state shared across independent Web and native Android clients, verifiable completion evidence, and resumable execution after network loss. This combination is not proven absent from competitors; it is a differentiation hypothesis to test against real workflows.

### Candidate opportunity pipeline

1. **Radar:** growing use of durable artifacts, deferred tool schemas, and visible computer-use approval.
2. **Thesis:** tool catalogs and long-running work can inflate model context and cost; users need the right capability without exposing every tool schema or granting every permission.
3. **Prototype (after Phase 1):** synthetic provider-neutral registry with 100 typed tools, 50 Arabic/English golden tasks, staged retrieval of full schemas, and a strict permission filter before the model sees callable tools.
4. **Validation target:** reduce tool-schema tokens by at least 50% relative to the full-catalog baseline while keeping tool-selection accuracy within 1 percentage point of baseline; zero unauthorized write tools exposed. These are proposed acceptance thresholds, not measured results.
5. **Prepare now:** keep stable tool IDs, concise descriptions, versioned JSON schemas, ownership, capability scopes and audit metadata separate from provider adapters.
6. **Kill criteria:** abandon or redesign if schema retrieval increases tool-selection errors by more than 1 percentage point, causes hidden tool exposure, adds more latency than it saves, or makes auditability worse.

### Forecast ledger — append-only hypotheses

| Horizon | Hypothesis / confidence | Supporting signals | Alternative / disconfirming evidence | Trigger to confirm or revise | Preparation |
|---|---|---|---|---|---|
| 30 days | More assistants will add durable, updateable artifacts, on-demand tool discovery and budgeted mission contracts. Medium. | Space rollout; Gemini Tool Retrieval preview. | Rollouts may remain limited or become provider-specific features without public APIs. | Stable public API or multiple production products exposing equivalent documented workflows. | Portable artifact and tool-registry contracts. |
| 90 days | Cloud agents will increasingly expose explicit app/capability permissions and visible execution traces. Low–medium. | Gemini Mac computer-use design; existing browser/computer-use products. | OS restrictions and vendor-specific sandboxes may prevent cross-platform parity. | Stable APIs plus reproducible third-party integration on supported devices. | Narrow typed Android capabilities and trace model; no broad permissions. |
| 180 days | Context-efficient tool selection will become a key cost/latency control for large agent systems. Medium. | Gemini Tool Retrieval addresses tool-schema overhead; growing tool catalogs. | Better context windows or provider-side caching may reduce the need for client-side retrieval. | Independent benchmarks showing repeatable cost/latency gains across providers. | Provider-neutral registry and golden-task benchmark. |
| 1–2 years | Personal agents will combine cloud orchestration, local app capabilities and portable memory/jobs. Medium. | MCP/A2A and Android capability work; product movement toward persistent agents. | Android policy restrictions, privacy concerns and vendor lock-in may slow adoption. | Stable platform APIs, user-controlled data portability and cross-provider execution contracts. | Keep cloud jobs, on-device actions and memory behind replaceable interfaces. |

### Scenario update

- **Base:** hosted models and cloud orchestration remain useful; durable user-owned state, Arabic UX and verified outcomes are robust investments.
- **Accelerated:** on-device models and Android app capabilities become practical; add opt-in adapters behind existing typed contracts.
- **Downside:** Android restricts automation, hosted inference remains costly, or competitors bundle agents at no extra cost; retain offline planning, explicit in-app actions and replaceable providers.
- **Robust choices:** one verified identity, least-privilege tools, portable memory/job records, user-visible traces, bounded retries, cancellation and rollback.

### Adoption decisions

- Build natively later: provider-neutral tool registry with schema versioning and permission metadata.
- Controlled experiment later: lazy schema retrieval using synthetic tasks and measured token/latency/accuracy comparisons.
- Integrate now: none.
- Defer: broad computer use, Android AppFunctions as a required dependency, external account connectors, multi-agent execution.
- Reject: copying proprietary UI/assets/prompts or relying on provider-only APIs as the core architecture.

This is a market-intelligence update only. It does not start the ten-product Phase 2 study, grant permissions, connect external accounts, enable model routing or external actions, or authorize deployment.


### Daily market update — 2026-11-22

#### Confirmed product changes

| Product | Evidence and maturity | What it does well | Limits / AbanoubAI decision |
|---|---|---|---|
| ChatGPT Space | OpenAI release notes, 20 Nov 2026: https://help.openai.com/en/articles/6825453-chatgpt-release-notes. Rolling out globally to Plus users aged 18+; interactive pages and presentations can update from connected apps/tools; web, desktop, iOS and Android. | Persistent collaborative artifacts that remain connected to source context. | Not available to this 15-year-old user under the announced age gate; plan/rollout constraints apply. **Defer** API assumptions; prepare a portable user-owned artifact contract only after Phase 1. |
| Claude Computer Use | Anthropic release notes, 20 Nov 2026: https://support.claude.com/en/articles/12138966-release-notes. Beta for Team/Enterprise, gradual rollout; desktop apps, with web/mobile access where computer access is enabled. | Visible screen-based execution across allowed desktop apps. | Beta and organization/permission constrained. **Do not clone broad screen control**; AbanoubAI should expose narrow app-owned Android capabilities with explicit scopes and an audit trail. |
| Gemini 4 Hydrogen / Neon | Google official announcements: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/ and https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/. Recent model launches positioned for agentic workflows and software/knowledge work. | Faster model iteration and task-oriented positioning. | Performance claims are vendor claims; no same-workflow Arabic/tool-use benchmark was run. **Controlled experiment later**, not an automatic router change. |
| Manus 2.0 | Official product overview: https://manus.im/blog. Existing Cloud Computer, Automations and connector workflows remain relevant; no new verified capability change in this 24-hour scan. | Persistent cloud computer and multi-step workflow packaging. | Operational usage/plan costs and permissions need account-level verification. **Defer integration** until cost, scopes and recovery are tested. |

#### Comparative insight

The strongest near-term pattern is a shift from chat replies toward persistent artifacts and delegated execution. OpenAI emphasizes living collaborative pages; Anthropic is extending screen-based execution under organization controls; Google is iterating task-oriented models; Manus packages cloud execution and recurring automations. None of these announcements proves reliable cross-client state, Arabic task quality, or safe execution for AbanoubAI's workflow. No capability above was adopted or benchmarked in this cycle.

#### Opportunity and ranked intelligence backlog

1. **Owner-isolated shared workspace data** — impact critical; evidence high (live policy audit); effort low–medium; risk medium because migration history is drifted. Acceptance: two synthetic users cannot read, create, update, delete, or reassign each other's goals; then a real Supabase staging smoke test. Prototype is PR #39; not merged/deployed.
2. **Arabic-first living artifacts with provenance** — impact high; evidence medium; effort medium; privacy risk manageable with user-owned storage. Acceptance: one artifact updated from a user-approved task, with source references and a visible change log, independently on Web and native Android. Defer until Phase 1.
3. **Typed Android capability bridge** — impact high; evidence medium (Claude computer-use beta and existing Manus–OPPO direction); effort high; platform/policy risk high. Acceptance: a single explicit user-triggered reminder action on a real supported Android device, with permission education, visible result, cancellation and no broad Accessibility privilege. Defer until user/device and API support are verified.
4. **Provider-neutral task benchmark** — impact high; evidence high that model releases are frequent, but quality/cost advantage unmeasured; effort medium. Acceptance: identical Arabic/English tool-calling tasks, with success, latency and cost per successful task measured before any routing change.

#### Forecast ledger (hypotheses, not roadmaps)

- **30 days — living artifacts become a more common assistant primitive.** Confidence: medium. Evidence: ChatGPT Space launch. Disconfirming signal: no documented APIs or sustained user adoption. Prepare: portable artifact/version/source contracts. Trigger: at least two providers expose documented artifact APIs or interoperable export.
- **90 days — Android agent integrations expand through OEM/app partnerships but remain permission constrained.** Confidence: medium. Evidence: Claude computer-use beta and Manus's previously announced OPPO partnership. Disconfirming signal: platform restrictions prevent third-party action APIs. Prepare: app-owned typed capabilities, consent scopes and visible traces. Trigger: a stable Android API or verified OEM integration available to third parties.
- **180 days — permission and execution observability become differentiators.** Confidence: medium. Evidence: OWASP agentic tool-execution and configuration-control guidance; https://cornucopia.owasp.org/edition/companion/AAI8/1.0/en and https://cornucopia.owasp.org/cards/AAI9. Disconfirming signal: platform-level controls standardize the same guarantees. Prepare: risk classes, per-tool audit and recoverable actions.
- **1–2 years — local models may handle more private routine tasks.** Confidence: low. Disconfirming signal: device memory/latency/energy or quality gaps persist. Prepare: a replaceable local-model adapter, but do not assume local inference is cheaper or adequate before device benchmarks.

#### Scenario planning

- **Base:** hosted models remain useful; portable user-owned state, Arabic UX, least privilege and verified completion remain robust.
- **Accelerated:** local models and Android capability APIs mature; add opt-in adapters behind the same typed contracts.
- **Downside:** Android restricts automation and competitors bundle assistant artifacts free; preserve offline planning, transparent state and provider neutrality rather than chasing broad device control.

This update is intelligence only. It does not begin the Phase 2 top-10 study, enable model routing, grant permissions, connect external accounts, or authorize deployment.
