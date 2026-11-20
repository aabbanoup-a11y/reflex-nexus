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
