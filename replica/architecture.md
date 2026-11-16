# AbanoubAI Target Architecture
**Date:** 2026-11-16  
**Status:** Proposed architecture based on repository recon and public capability benchmark.  
**Prerequisite:** Review and approve before production-impacting changes.

## 1. Product architecture
AbanoubAI is one product with two independent first-party clients:
- **Web client:** React/TanStack Start, optimized for research, projects, files, workflows, code and administrative surfaces.
- **Android client:** native Kotlin app, optimized for chat, voice, notifications, offline-first local data and user-approved phone actions.
- **Shared backend:** common identity, API contracts, conversation/task state, model routing, orchestration, storage, memory, connectors, schedules, policies and audit.
- Neither client opens or embeds the other. No WebView dependency for the primary Android experience.

## 2. Logical layers
```text
Web Client (React)                Android Client (Kotlin)
       |                                  |
       +---------- Authenticated API -----+
                          |
              API / Session Boundary
                          |
        +-----------------+-------------------+
        |                 |                   |
  Conversation       Agent Orchestrator   User Data Services
  & Project API      Plan / Delegate      Files / Memory / Tasks
        |                 |                   |
        +----------- Policy Engine -----------+
                          |
                 Model Router / Gateway
          +---------------+----------------+
          |               |                |
      Cloudflare       OpenAI           Anthropic
      Workers AI       API              API
          |               |                |
          +---------- Google AI -----------+
                          |
                 Tool / Connector Registry
       Browser | Search | GitHub | Supabase | Cloudflare
       User-approved MCP / integrations | Android Companion
                          |
                Audit + Usage + Telemetry
                          |
                 Supabase Postgres
              Storage / Realtime / Auth
```

## 3. Core backend services
### Identity and authorization
- Supabase Auth remains the identity provider.
- Each request is authenticated using the user's session/JWT.
- Server derives user identity from verified auth context; never trusts client-supplied `user_id`.
- Service-role credentials remain server-only and are never exposed to browser or APK.
- Enforce tenant/user ownership on every conversation, message, attachment, memory, project, tool connection, task, and audit query.

### Conversation and project service
- Versioned contracts for conversation create/list/get/update/delete, message append/list, attachments, and project context.
- Persist message order, timestamps, model/provider used, token/usage metadata where available, tool events, citations, and error state.
- Support cancellation and retry without duplicate writes (idempotency keys).
- Android and web use the same data contract but independent UI and local cache policies.

### Model registry and router
Replace the hard-coded "available model" assumption with a server-owned registry:
- provider + canonical model ID + provider API mapping
- enabled/disabled state and last successful health check
- supported modalities (text/image/audio/video/files/tools/structured output)
- context/output limits where published
- region/plan/access constraints and provider terms
- latency/cost metadata with timestamp and provenance
- fallback compatibility and failure classification

Routing order:
1. Validate request intent, modality and risk.
2. Filter models by live verified capabilities and configured credentials.
3. Apply user preference, quality tier, latency and cost budget.
4. Choose one primary model and at most a small bounded fallback chain.
5. Return selected model and reason; never silently pretend a model ran when fallback occurred.
6. Record provider health and usage; allow user to override automatic choice.

Do not fan out to every model by default. Multi-model comparison is an explicit, bounded mode.

### Agent orchestrator
A manager creates a typed task plan:
- goal, constraints, acceptance criteria
- subtasks with dependencies and owner agent
- permitted tools/scopes
- model capability requirements
- budget, deadline, concurrency and cancellation token
- risk level and approval requirements

Specialist agents are reusable configurations/skills, not 100s of fictitious employees. Start with a small set: General Assistant, Researcher, Coder, File Analyst, Planner, Phone Operator. Add specialists only when evaluation shows a distinct benefit.

Agent lifecycle:
`queued → planning → awaiting_approval (if needed) → running → verifying → completed | failed | cancelled`.

The manager must validate specialist outputs, cite evidence, resolve disagreement and report partial completion honestly.

### Tool and connector registry
Every tool has:
- stable ID and version
- JSON input/output schema
- read/write classification
- identity and OAuth scopes
- resource allowlist
- risk classification
- timeout/retry/idempotency behavior
- audit event contract
- owner and enabled state

Model-generated tool calls are proposals only. A deterministic policy layer validates and authorizes them before execution.

### Policy and approval engine
Require explicit confirmation for:
- sending messages/emails or publishing externally
- purchases, payments or financial changes
- deleting or overwriting user data
- changing permissions, account security or integrations
- merging code, deploying, changing production infrastructure
- Android actions that affect other people or sensitive data

Read-only, reversible, low-risk operations may run automatically within granted scopes. Approval is bound to exact action + target + arguments + expiry; a generic "yes" must not authorize a different action.

### Research and provenance
- Search and browser tools return structured source records: URL, title, publisher, retrieval time, excerpt/content reference.
- Claims in final research artifacts link to evidence.
- Separate observed facts, model inference and recommendations.
- Deduplicate sources, track conflicts and disclose missing coverage.
- Browser access must respect robots/terms, authentication, rate limits and user permissions.

### Files and artifacts
- User-owned storage paths and signed URLs with short expiry.
- Server validates file owner, size, MIME, extension, malware/content handling and parser support.
- Durable artifacts are associated with user, project and task.
- Use provider APIs for generation; do not claim image/video/audio generation without a configured provider and successful result.

### Memory
- User-scoped, consent-controlled memory.
- Separate durable preferences from task history and raw conversation.
- Provide inspect/edit/disable/delete workflows.
- Apply retention and data minimization. Never use another user's memory or project context.

### Automation
- Schedules and event triggers use durable job records, idempotent execution, retry limits, pause/cancel, time zones and audit history.
- Test-run mode before enabling triggers.
- External sends/publishing require an explicit approval policy.

## 4. Android-specific architecture
- Native Kotlin UI and navigation; no embedded web dashboard as the primary app screen.
- Android app uses Supabase Auth or a verified session exchange, then calls the shared authenticated API.
- Local Room/database cache for conversations and pending safe actions; encrypted storage for tokens where supported.
- Offline behavior is honest: local notes, cached history and deterministic allowlisted commands can work offline; cloud models, live web research and remote connectors cannot.
- AccessibilityService is optional, user-enabled and purpose-limited. Show a persistent state indicator and emergency stop.
- Ask for OS permissions just in time, explain purpose, and support revocation.
- Treat on-screen text and browser pages as untrusted input; defend against prompt injection and never let page content expand tool permissions.
- Do not claim local LLM support: current `QwenEngine.kt` explicitly returns `load() = false` and `cloud-only`.
- Release signing must use a user-controlled production keystore/CI secret. Current Gradle config points release signing at the Android debug keystore and is not a production release setup.

## 5. Web-specific architecture
- Keep existing React/TanStack routes and migrate toward a coherent workspace shell.
- Responsive desktop/mobile web experience remains independent of Android native UI.
- Primary work areas: Chat, Research, Agent Runs, Projects, Files/Artifacts, Models, Integrations, Automations, Memory, Settings.
- Show task plans, sources, model identity, tool activity, run history and approval prompts.

## 6. API boundaries
Proposed versioned API groups:
- `/api/v1/auth/session`
- `/api/v1/conversations`
- `/api/v1/projects`
- `/api/v1/files`
- `/api/v1/models`
- `/api/v1/agent-runs`
- `/api/v1/tools`
- `/api/v1/approvals`
- `/api/v1/memory`
- `/api/v1/automations`
- `/api/v1/companion`

These are target contracts, not claims that these routes currently exist. Prefer the current TanStack server layer or Supabase Edge Functions only after selecting one canonical server boundary and documenting deployment/runtime constraints. Avoid duplicating business logic in clients.

## 7. Build sequence
1. **Foundation audit and safety:** authentication, RLS, attachment ownership, model adapter validity, tool authorization, release signing.
2. **Design system and shell:** finalize the independent web and Android navigation and reusable design tokens.
3. **Unified chat:** persistence, streaming, file attachments, model selector, provider fallback, stop/retry.
4. **Agent mode:** plan timeline, bounded specialists, tool registry, approvals, verification, artifacts.
5. **Research and browser:** cited search, source library, browser session with progress and takeover.
6. **Integrations and coding:** connectors/MCP, GitHub repository workspace, branch/CI/PR review workflow.
7. **Automation and memory:** recurring jobs, project context, user-controlled memory.
8. **Android-native companion:** API parity, voice, offline cache, permissioned phone actions, device QA.
9. **Hardening and release:** test matrix, accessibility, privacy, observability, load/cost tests, production signing.

## 8. Architecture decision records required
- ADR-001: canonical backend/API boundary (TanStack server vs Supabase Edge Functions vs Cloudflare Worker).
- ADR-002: provider credentials and user-owned keys vs platform-managed keys.
- ADR-003: streaming protocol and cancellation.
- ADR-004: Android session lifecycle and secure token storage.
- ADR-005: memory model, retention and deletion.
- ADR-006: approval/risk taxonomy and enforcement.
- ADR-007: model capability registry and health-check strategy.

## Acceptance criteria
- Android can perform core chat without loading the web app.
- Web can perform the same core chat independently.
- Both clients see the same authorized conversations/projects.
- A model/tool is never shown as available unless its configuration and capability are verified.
- No client can access another user's files or data.
- Risky actions are blocked until exact-action approval is granted.
- Every agent run is cancellable, traceable and reports verified outcomes.
- No production deploy or release is called successful without CI and runtime evidence.
