# Native Android migration — Reflex Nexus

## Release goal: a reliable chat first
Deliver one stable Android app whose primary job is to let the user sign in to the same account as the web app, choose a genuinely configured AI model, send messages, receive real provider responses, and retain/sync conversations where the backend supports it. The target network is 162 models/agents, but count only models whose provider, authentication, routing, and response path have been verified. A model tile or registry entry alone is not proof that a model works.

## Phase 1 — release blockers only
1. **Secure cloud chat:** review and finish PR #18 authentication/attachment ownership work; verify the Android client sends the authenticated session/Bearer token; keep privileged provider keys server-side.
2. **Real model network:** inventory the configured model catalog and provider routes; test each provider path with a minimal real request; distinguish working, unavailable, and unverified models. Do not promise 162 live models until evidence supports it.
3. **Native chat reliability:** sign-in/session handling, model selection, send/receive, conversation history and sync where supported, loading/error/timeout states, retry without duplicate messages, and clear unavailable-model errors.
4. **500-command capacity target:** design the command/tool registry to support up to 500 registered commands with schemas, permissions, validation, logging, rate/cost limits, and tests. This is a capacity target, not a claim that 500 commands already exist or work. Initially expose only commands that have been implemented and tested.
5. **Build and verify:** configure required GitHub Actions secrets through repository settings (never paste secrets into chat or source), run CI, produce a fresh APK, and smoke-test on Android 10/low-memory hardware before calling the release stable.

## Phase 2 — explicitly deferred
Defer assistant/team and employee pages, the wider skills catalog, workflows/routes, external integrations/connectors, local model inference, and unrelated website pages until Phase 1 chat/model reliability is demonstrated. Keep them tracked, but they must not delay the core release.

## Security and product constraints
- The web app on `main` remains the source of truth for existing backend contracts.
- Do not copy provider secrets or privileged Supabase keys into the APK.
- Preserve authenticated user boundaries and RLS; do not make production security changes without reviewing access and testing allowed/denied cases.
- Do not fake provider responses or mark a model/command as working without test evidence.
- Target Android 10 / API 29 and low-memory devices where feasible.
- Do not claim build, installation, model coverage, sync, or device QA succeeded unless logs or tests prove it.

## Daily development rule
Each daily maintenance run must complete **one small, high-value, verifiable change** toward Phase 1. Inspect the current GitHub state and CI first, choose the highest-priority safe blocker, implement and test one change, then record commit/CI/artifact evidence and the next blocker in GitHub/TickTick. If blocked by owner-only secrets or permissions, record the exact blocker and work on an independent safe task; never claim progress that did not occur. Avoid broad refactors and do not start Phase 2 work while Phase 1 release blockers remain.

## Current known risks
- Android native chat exists, but cloud connectivity and same-account sync are not yet proven.
- `QwenEngine.load()` returns false; local inference is not implemented.
- The model registry describes 50 network models plus a manager model; it does not establish that the user's target of 162 models is configured or operational.
- GitHub Actions previously lacked required Supabase secrets; no fresh release APK is considered verified until a current workflow succeeds.
- PR #18 covers chat authentication and attachment ownership and must be reviewed/tested before cloud chat is treated as secure.
