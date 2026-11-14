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
Android AppFunctions expose typed app capabilities to the Android intelligence system. Official Android documentation describes them as local OS-level functions and distinguishes them from remote MCP, which requires network round-trips. The feature is experimental/preview and access to the complete agent pipeline is limited; it must not be represented as a generally available capability for every third-party assistant.

### Implementation direction
- Build the companion with Kotlin, Jetpack Compose, and Material 3.
- Define narrow, typed app functions for tasks the companion itself owns: create/update an AbanoubAI task, prepare a daily plan, read a permitted schedule, acknowledge a notification, or sync an approved routine.
- On Android 16+ compatible environments, prototype AppFunctions behind feature detection and capability checks.
- On older or unsupported environments, use ordinary Android intents, notifications, calendar/task APIs where available, app shortcuts, and the app's own UI.
- Use a remote MCP server for cross-platform/cloud tools; do not confuse it with local AppFunctions.
- Use WorkManager for persistent deferrable background work. Use AlarmManager exact alarms only for genuinely time-critical user-facing alarms/reminders with the required special access.
- Respect Doze, OEM background restrictions, battery optimization, lifecycle, network loss, and Android/Google Play policies.
- Do not use Accessibility services as a general-purpose permission bypass or promise arbitrary control of other apps.
- Confirm actual device Android version and supported APIs before enabling capabilities.

### Sources
- Android AppFunctions: https://developer.android.com/ai/appfunctions
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
- Security advisor snapshot reported 14 authenticated-executable SECURITY DEFINER functions, one expected INFO for `webauthn_challenges` (RLS enabled, no client policies), and leaked-password protection disabled. Each function requires individual review; do not bulk-revoke.
- Performance advisor snapshot reported 44 unindexed foreign-key findings, 19 unused-index notices, multiple permissive RLS policy warnings, and RLS policy auth-function re-evaluation warnings. Inspect query plans and actual workload before changing indexes or policies.
- PR #18 remains a candidate to verify for cloud chat authentication and attachment ownership; its actual merge/readiness state and real HTTP test evidence must be checked before merge.
- `emergency_kill_switch=true`, `enable_ai_routing=false`, and `enable_external_actions=false` remain protected settings. Do not change them just to pass tests.
- Secret validity, model-provider connectivity, full cloud-agent execution, signed Android release, and physical-device behavior are not established by these metadata checks.

This document is a product/engineering target. It does not certify current implementation or production readiness.
