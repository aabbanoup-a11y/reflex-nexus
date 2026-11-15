# AbanoubAI Product & Engineering Master Standard

**Status:** Proposed product constitution  
**Repository:** `aabbanoup-a11y/reflex-nexus`  
**Application:** https://reflex-nexus.lovable.app  
**Supabase project:** `wobfdslqlmvlatyrtgkd`  
**Last researched:** 2026-11-15

## 1. Product thesis

AbanoubAI is a **Personal Intelligence & Execution Operating System**, not a chat interface with a collection of bots.

It should help a person turn intentions into verified outcomes: understand goals and current context, plan work, select models and tools, delegate bounded tasks, execute across connected services and the Android companion, verify results, recover from failures, and learn from explicit feedback.

The product promise is not unrestricted control. It is **high agency inside clearly granted scopes, with reliable execution, understandable behavior, privacy, and recoverability**.

## 2. Product principles

1. **Outcome over conversation.** Measure completed user goals, not message count or model eloquence.
2. **Plan, execute, verify.** Separate planner, executor, verifier, and auditor responsibilities. A model's assertion is not proof of success.
3. **Autonomy by scope.** Routine, reversible work can run under durable user-granted scopes without repeated prompts. High-impact or irreversible work needs a review or recoverable path.
4. **Local-first where it matters.** Keep sensitive context and device capabilities local when practical; disclose and control cloud/provider data flows.
5. **Provider-neutral intelligence.** Do not make the product dependent on one model vendor, model name, or orchestration framework.
6. **Graceful degradation.** Continue with reduced capabilities during network loss, provider outage, quota exhaustion, or partial service failure.
7. **User ownership.** Provide memory inspection, correction, export, deletion, and clear retention controls.
8. **Evidence, not theater.** No fake integrations, simulated completion presented as real, or unverified readiness claims.
9. **Accessible by default.** Arabic RTL and English LTR, accessible contrast, scalable typography, keyboard/screen-reader support, and low-end-device performance.
10. **Cost-aware by design.** Optimize cost per successfully completed task, not simply token price.

## 3. Reference architecture

The system should evolve toward these logical layers. They are boundaries, not a mandate to deploy twelve separate services.

### A. User and context
- Identity, authentication, consent, preferences, timezone, language, device registration.
- Explicit separation between personal, project, and shared/workspace data.
- Context provenance, freshness, confidence, and source references.

### B. Memory
- Working memory: current task and active plan.
- Episodic memory: user-approved events and outcomes.
- Semantic memory: stable facts and knowledge.
- Procedural memory: approved routines and workflows.
- Goal memory: long-term goals, milestones, constraints, and progress.
- Every memory item needs ownership, provenance, timestamps, retention rules, and correction/deletion behavior.

### C. Intelligence runtime
- Intent classification and task decomposition.
- Planner with dependencies, deadlines, budgets, and re-planning.
- Model router based on measured quality, latency, cost, modality, privacy, availability, and context size.
- Specialist agents with typed task contracts and narrow scopes.
- Tool/skill registry with versioned schemas, permissions, owner, risk class, idempotency, and verification method.
- Durable task execution with checkpoints, bounded retries, cancellation, and compensation/rollback.

### D. Knowledge and interoperability
- Retrieval with source attribution and freshness checks.
- MCP as a candidate standard for portable tool access.
- A2A as a candidate for cross-agent task delegation.
- Adopt standards only where interoperability benefit exceeds implementation and operational cost.

### Protocol signals to design around (researched 2026-11-15)
- The stable MCP specification dated 2026-07-28 introduced a stateless protocol core, multi-round-trip requests, header-based routing, cacheable list results, authorization hardening, and a formal extensions framework. This is a strong signal that remote tool infrastructure is moving toward simpler horizontal scaling and more explicit capability evolution.
- A2A is now a stable v1.0 protocol; the official repository released v1.0.1 on 2026-05-28. The protocol focuses on agent discovery, modality negotiation, task lifecycle, and collaboration between independent agents. SDKs have their own release versions (for example, Python v1.2.0 on 2026-09-29 and JavaScript v1.1.0 on 2026-08-26), so record protocol and SDK versions separately.
- Keep AbanoubAI's internal capability contract independent of either wire protocol. Add protocol adapters only at boundaries: AppFunctions for supported on-device app capabilities, MCP for remote tools, and A2A only when cross-agent collaboration is a demonstrated requirement.
- Negotiate and record protocol/SDK versions; do not assume every MCP client supports the latest extensions or that an A2A peer supports every modality. Test auth, cancellation, task status, retries, and partial failure before production use.
- Do not migrate the existing runtime to a new protocol revision solely because it is newer. First build a compatibility spike and compare latency, reliability, auth complexity, operational cost, and recovery against the current implementation.

### Computer-use agent signals (researched 2026-11-15)
- OpenAI's Agents API computer-use flow runs a browser in an OpenAI-hosted environment. The integrating application handles new-origin access approvals and sign-in, follows session events, supports recovery of the same session after connection loss, and must explicitly cancel turns and clean up sessions.
- Anthropic's Computer Use tool exposes screenshot, mouse, and keyboard operations through a client-controlled environment; its browser-use tool is a better fit when the task stays within webpages because it can use page structure and target controls rather than relying only on screen coordinates.
- Product implication: prefer documented APIs and typed tools first, semantic/browser automation second, and screenshot-based computer interaction only when the other paths are unavailable. Every computer-use session needs explicit origin/session scope, sign-in approval, cancellation, activity history, bounded runtime, and post-action verification.
- These are desktop/browser capabilities, not evidence of unrestricted Android device control. Do not translate them into Accessibility-based permission bypasses or promises to operate arbitrary phone apps.

### Dated market intelligence and opportunity ledger (2026-11-15)

#### Confirmed product and protocol signals
- **OpenAI Agents API — public beta (announced 2026-09-10); computer use added 2026-09-29.** The managed harness emphasizes long-running sessions, subagents, and a hosted browser. The application still owns origin approval and sign-in flows. This is strong evidence that reliable agent execution is becoming a productized runtime, not just a prompt plus tools. Availability and operating cost must be checked before adoption.
- **Anthropic Claude Managed Agents — self-hosted option announced 2026-11-12.** The full managed-agent service, agent/session state, and history can run on customer infrastructure; access currently requires contacting Anthropic. Claude Fable 5.2 launched 2026-11-09 with a 1M context window and 128k maximum output, at published rates of $8/MTok input and $40/MTok output. This is a useful signal for infrastructure control and long-horizon reasoning, not evidence that AbanoubAI should hard-code a provider or model.
- **LightAgent — v1.0.0 released 2026-11-15 (Apache-2.0).** Its repository describes reconnectable execution, a shared Job/Subagent lifecycle, transactional recovery, and optional signed Providers. Its v0.11.0 line added persistent dynamic DAG execution, verification-gated artifacts, restart-safe leases/fencing, and a narrowing-only SecurityContext. These are project-maintainer claims; the framework has not been benchmarked against AbanoubAI's TypeScript/Supabase workload.
- **Smartopol Agent — private beta, self-hosted and closed-source.** Its product site describes hierarchical memory consolidation and cross-channel recall, and says a standalone MCP memory layer became public on 2026-10-01. Treat the architecture as a research signal only; claims are not independently verified and the agent itself is not open source.
- **Android AppFunctions — AndroidX 1.0.0-rc01 released 2026-11-04.** The library has reached release-candidate maturity, but that does not establish broad availability of the complete system-agent integration on every Android 16 device.
- **MCP — stable specification 2026-07-28.** The release adds a stateless protocol core, formal extensions, Tasks as an extension, MCP Apps, authorization hardening, and improved trace propagation. It includes compatibility changes from 2025-11-25; negotiate and test versions rather than assuming every client implements the newest revision.
- **A2A — stable protocol v1.0.1.** The v1.0 line provides version negotiation and multi-transport agent collaboration; use it only at a genuine agent-to-agent boundary. MCP remains the better fit for an agent's tools and data sources.

#### Comparative lesson and adoption decisions
- Managed cloud agents (OpenAI) reduce runtime operations but increase hosted-environment and provider dependency. Anthropic's self-hosted option increases infrastructure control but is currently gated behind account-team access. AbanoubAI should keep its own task/job contract portable and treat both as optional providers, not the system of record.
- LightAgent demonstrates useful patterns for durable job recovery and verifier-gated artifacts. **Decision: adapt the patterns, not the Python framework**, until a reproducible Arabic/English benchmark shows a material advantage over the existing TypeScript/Supabase stack.
- Smartopol reinforces the importance of consolidation and cross-session recall. **Decision: prototype memory provenance, correction, expiry, and consolidation in AbanoubAI's own memory model; do not adopt a closed-source dependency or copy its product design.**
- AppFunctions remains an optional Android adapter. Do not enable it by default or advertise it until a compatible Android 16+ device and caller are confirmed.
- The differentiating opportunity is an Arabic-first personal system that combines durable execution, user-inspectable memory, safe Android capabilities, and proof of completion. No competitor comparison in this snapshot is a claim of benchmark superiority.

#### Ranked product-intelligence backlog
1. **Resolve Android/web Supabase project alignment (critical impact, low effort, high confidence).** Acceptance: the web-issued JWT `iss` equals the Android companion's configured `SUPABASE_URL/auth/v1`; authenticated reads and writes succeed; a mismatched issuer is rejected before network polling.
2. **Durable task/session recovery (high impact, medium-high effort, medium confidence).** Acceptance: interrupt a multi-step task during network loss/process restart, resume from a checkpoint without duplicate side effects, and verify the final state from tool output.
3. **Inspectable memory consolidation (high impact, medium effort, medium confidence).** Acceptance: every retained memory has source/provenance, confidence, freshness/expiry, correction and deletion behavior; recall tests improve without cross-user leakage.
4. **Android AppFunctions compatibility spike (medium impact, medium effort, low confidence until device OS is known).** Acceptance: register one narrow app-owned function on a compatible Android 16+ device, inspect it with the official tooling, and demonstrate safe fallback on older devices.

#### Forecast ledger
- **30–90 days, medium confidence:** agent products will continue differentiating on durable sessions, reconnectability, and observable task state. Prepare with provider-neutral job contracts, checkpoints, idempotency, cancellation, and verifier-owned completion.
- **90–180 days, medium confidence:** self-hosted and customer-controlled agent execution will become a more visible option, while hosted runtimes remain easier to operate. Keep deployment and model-provider boundaries replaceable.
- **90–180 days, medium confidence:** AppFunctions library maturity may outpace broad availability of system-agent callers. Keep the integration capability-detected and optional.
- Disconfirming evidence: vendor APIs remain closed or region-gated, Android caller availability remains narrow, or durable runtime features fail to improve real task success and recovery. Reassess against releases and device tests; these are hypotheses, not launch predictions.


### E. Android companion
- Native Android client, separate from the web application.
- On-device capability adapter and cloud agent bridge.
- Event-driven triggers, not continuous model polling.
- Offline queue and reconciliation.
- User-visible permissions, activity history, and capability health.

### F. Trust, observability, and evaluation
- Per-user and per-tool authorization.
- Policy evaluation before every tool call.
- Structured traces across planner, model, tool, and device.
- Evaluation suite, regression gates, cost accounting, incident handling, and release evidence.

## 4. Android integration strategy — decision record ADR-001

**Decision:** Use a hybrid architecture: native app-owned capabilities + remote MCP tools, and evaluate Android AppFunctions as an optional first-class integration for compatible devices.

### Why
Android AppFunctions expose typed app capabilities to the Android intelligence system. Official Android documentation still labels the end-to-end feature experimental/preview: developers can implement and test AppFunctions on Android 16+, but access to the complete system-agent pipeline remains limited to selected apps/testers. Importantly, the AndroidX release page now lists `androidx.appfunctions:appfunctions:1.0.0-rc01` (updated 2026-11-04). A Jetpack library release candidate is a meaningful implementation-readiness signal, but it does **not** mean the end-to-end Android agent integration is generally available. Keep the integration optional and capability-detected; do not advertise it as working with every assistant or device.

### Implementation direction
- Build the companion with Kotlin, Jetpack Compose, and Material 3.
- Define narrow, typed app functions for tasks the companion itself owns: create/update an AbanoubAI task, prepare a daily plan, read a permitted schedule, acknowledge a notification, or sync an approved routine.
- On Android 16+ compatible environments, prototype AppFunctions behind feature detection and capability checks. Evaluate the AndroidX `1.0.0-rc01` artifact in an isolated branch; pin the library/compiler versions and do not upgrade the app's global toolchain solely for this experiment.
- Verify that functions are registered on a real compatible device using the official AppFunctions inspection command: `adb shell cmd app_function list-app-functions --package <your.package.name>`. Record the OS build, package version, caller/agent availability, and observed result.
- On older or unsupported environments, use ordinary Android intents, notifications, calendar/task APIs where available, app shortcuts, and the app's own UI.
- Use a remote MCP server for cross-platform/cloud tools; do not confuse it with local AppFunctions.
- Use WorkManager for persistent deferrable background work. Use AlarmManager exact alarms only for genuinely time-critical user-facing alarms/reminders with the required special access.
- Respect Doze, OEM background restrictions, battery optimization, lifecycle, network loss, and Android/Google Play policies.
- Do not use Accessibility services as a general-purpose permission bypass or promise arbitrary control of other apps.
- Confirm actual device Android version and supported APIs before enabling capabilities.

### Sources
- Android AppFunctions: https://developer.android.com/ai/appfunctions
- AndroidX AppFunctions release notes (1.0.0-rc01, updated 2026-11-04): https://developer.android.com/jetpack/androidx/releases/appfunctions
- MCP 2026-07-28 specification release: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- A2A v1.0.1 protocol release: https://github.com/a2aproject/A2A/releases
- A2A Python SDK releases: https://github.com/a2aproject/a2a-python/releases
- A2A JavaScript SDK releases: https://github.com/a2aproject/a2a-js/releases
- OpenAI Agents API announcement (2026-09-10): https://openai.com/index/introducing-the-agents-api/
- OpenAI API changelog (computer use, 2026-09-29): https://developers.openai.com/api/docs/changelog
- Anthropic Claude Platform release notes (2026-11-12 / 2026-11-09): https://platform.claude.com/docs/en/release-notes/overview
- LightAgent project and license: https://github.com/wanxingai/LightAgent
- Smartopol Agent product information: https://www.smartopol.ai/
- OpenAI Agents API computer use: https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use
- Anthropic computer-use tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- Android intelligence system: https://developer.android.com/ai/intelligence-system
- Android background work: https://developer.android.com/develop/background-work/background-tasks/persistent
- Android alarms: https://developer.android.com/develop/background-work/services/alarms
- Android AppFunctions engineering example (2026-07-21): https://android-developers.googleblog.com/2026/07/build-intelligent-android-apps-appfunctions.html

## 5. Autonomy and capability policy

Avoid repeated approvals for ordinary, reversible operations within scopes the user has explicitly configured.

Each capability definition must include:
- User and device scope.
- Allowed resources and operation types.
- Risk class and data sensitivity.
- Expiration and revocation behavior.
- Rate, cost, and execution limits.
- Dry-run/preview support where useful.
- Idempotency key and duplicate prevention.
- Verification method and audit event.
- Undo or compensation path where possible.

Default policy:
- **Routine / reversible:** may run automatically inside a granted scope (e.g. create a personal reminder or draft a daily plan).
- **Sensitive / externally visible:** require review or an explicit pre-authorization with narrow recipients/resources and clear status (e.g. send a message, publish, share private data).
- **Irreversible / high impact:** require a deliberate confirmation or a tested recovery path (e.g. permanent deletion, account/security changes, purchases).

A user may configure durable permissions for specific safe workflows. Do not turn a single approval into unlimited authority. A model may draft a new skill, but activation requires review, sandboxing, tests, scoped permissions, and rollback.

## 6. Model strategy and evaluation

Keep a provider-neutral adapter. At each model selection cycle, check official model catalogs, supported API features, pricing, quotas, regional availability, data controls, and deprecation status.

Potential providers include OpenAI, Anthropic, Google, DeepSeek, and suitable open-weight/local models. Do not hard-code unverified model names or promise unlimited free cloud inference.

Create an internal task benchmark covering:
- Arabic and English understanding and generation.
- Planning and multi-step task completion.
- Tool selection and typed arguments.
- Coding and structured output.
- Long-context retrieval and memory grounding.
- Vision/audio only where the product needs them.
- Prompt injection resistance and refusal correctness.
- Latency, availability, token use, and cost per successful task.

Choose models by measured task-specific quality, reliability, latency, privacy, and total cost. Implement provider fallback, circuit breakers, budget caps, safe caching, and graceful degradation.

## 7. Agent execution contract

Every task should have:
- Unique task and idempotency IDs.
- User, agent, and capability identity.
- Goal, success criteria, inputs, and provenance.
- Dependencies, deadline, and budget.
- Current state and checkpoint.
- Tool calls and structured results.
- Verification evidence.
- Retry/cancel/rollback behavior.
- Final user-readable summary.

Recommended lifecycle:

`requested → planned → authorized → running → verifying → completed | failed | needs_review | cancelled`

State transitions must be explicit and validated. Retries must not duplicate external side effects. The verifier must inspect tool/system state rather than trust the model's narrative.

## 8. Experience and design system

Create a cohesive product language using Material 3 as the Android foundation and a matching web design system.

Required surfaces:
- Home / Life Command Center.
- Natural-language chat with text, voice, image, and file input where supported.
- Daily and weekly planner.
- Agent activity center with live task state and evidence.
- Agent and tool registry.
- Memory manager with source and correction controls.
- Device connection and permission center.
- Integration health.
- Searchable activity/audit history.
- Cost and model usage controls.
- Onboarding, offline, loading, empty, error, and recovery states.

Design requirements:
- Arabic RTL and English LTR.
- Dark and light themes.
- Distinctive app icon and coherent visual identity.
- Responsive layouts for small Android screens.
- Accessible contrast, scalable type, screen-reader labels, and predictable navigation.
- Calm information hierarchy; avoid decorative complexity that hides task status.

## 9. Quality, security, and operations

Use the following references selectively:
- OWASP Top 10 for Agentic Applications 2026: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- MCP specification: https://modelcontextprotocol.io/
- A2A protocol: https://a2a-protocol.org/
- OpenTelemetry: https://opentelemetry.io/docs/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Supabase security guidance: https://supabase.com/docs/guides/database/postgres/row-level-security

Test:
- Cross-user data isolation.
- Authentication and role escalation.
- Prompt injection from user and retrieved content.
- Tool misuse and excessive agency.
- Memory poisoning and stale context.
- Replay, idempotency, retries, and state transitions.
- Secret leakage into client bundles/logs.
- Export/deletion and retention correctness.
- Provider outage, quota exhaustion, and offline recovery.
- Android permission denial, process death, reboot, Doze, and OEM restrictions.
- Accessibility, low-end device performance, and battery/network cost.

Instrument traces, metrics, and logs across each task. Measure domain-level task success, verified tool success, false-completion rate, recovery rate, p50/p95 latency, cost per successful task, crash-free sessions, battery/network impact, and security findings.

Numerical SLOs must be proposed only after establishing a baseline. Do not claim 99% or 99.9% performance without representative measurement.

## 10. Delivery roadmap and release gates

1. **Baseline and trust:** current-state audit, close confirmed security gaps, reliable CI, secrets inventory, observability.
2. **Core runtime:** task contract, planner/executor/verifier split, tool registry, durable job lifecycle.
3. **Personal context:** memory provenance, goal model, daily planner, user controls.
4. **Native Android foundation:** Kotlin app, device registration, permissions, local capability adapter, offline behavior.
5. **Android agent integration:** AppFunctions prototype where supported, remote MCP bridge, background scheduling and device testing.
6. **Model intelligence:** provider-neutral router, benchmark suite, fallback and budget controls.
7. **Polished product:** design system, icon, accessibility, Arabic/English, onboarding and activity center.
8. **Production readiness:** security review, load/recovery tests, signed release, real device verification, backup/restore and incident procedures.

A phase is complete only when its acceptance tests pass and evidence is recorded. A successful web build does not prove Android device integration; a debug APK does not prove a signed release; a deployed function does not prove provider connectivity.

## 11. Proposed product scorecard

Track these domains separately: intelligence, planning, agent collaboration, verified execution, Android integration, memory quality, model efficiency, UX/accessibility, security/privacy, reliability, performance/battery, evaluation coverage, observability, extensibility, and operational cost.

Initial targets are hypotheses, not current results:
- Zero known cross-user data access in security tests.
- Zero secrets in client bundles.
- Every externally visible side effect has an audit record and idempotency protection.
- No false completion in the release-critical golden test suite.
- A measured baseline and regression budget for task success, latency, cost, crash rate, and battery impact.
- All Android capabilities tested on actual supported OS/device combinations before being advertised.

## 12. Current project facts to revalidate

As of the 2026-11-15 review:
- Main branch tip: `6f708f603157306911f27fe9c4a7fd2949ca32ab`.
- Supabase migration history includes `20261113142649_lock_role_helpers_to_current_user` and `20261113143847_lock_webauthn_challenges_table`; the live migration list reports both.
- Live Edge Function metadata reported `agent-control` v5 and `reflex-nexus-chat` v3, both ACTIVE with JWT verification enabled.
- Security advisor snapshot reported 14 authenticated-executable SECURITY DEFINER functions, one expected INFO for `webauthn_challenges` (RLS enabled, no client policies), and leaked-password protection disabled. A live read-only review confirmed `has_role`, `can_write`, and `can_review` require `_user_id = auth.uid()`; multiple RLS policies call these helpers, so blanket EXECUTE revocation would break policy evaluation. Do not bulk-revoke; add targeted regression coverage.
- Performance advisor snapshot reported 44 unindexed foreign-key findings, 103 RLS auth-function re-evaluation findings, 19 unused-index notices, and 13 multiple-permissive-policy findings. Inspect query plans and actual workload before changing indexes or policies.
- Read-only edge logs for 2026-11-14 23:09–23:26 UTC showed 62 `401 / PGRST301` requests to companion tables. Their JWT issuer host differed from the configured target project while the tokens were still within their recorded expiry. This is a cross-project auth configuration mismatch, not evidence of token expiry. PR #29 adds a fail-fast issuer guard; it is not merged or deployed.
- PR #18 remains a candidate to verify for cloud chat authentication and attachment ownership; its actual merge/readiness state and real HTTP test evidence must be checked before merge.
- `emergency_kill_switch=true`, `enable_ai_routing=false`, and `enable_external_actions=false` remain protected settings. Do not change them just to pass tests.
- Secret validity, model-provider connectivity, full cloud-agent execution, signed Android release, and physical-device behavior are not established by these metadata checks.

This document is a product/engineering target. It does not certify current implementation or production readiness.
