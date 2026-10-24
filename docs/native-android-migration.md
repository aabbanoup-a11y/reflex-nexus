# Native Android migration — Reflex Nexus

## Product definition
The user talks to **one AI assistant** in one chat. That assistant sends the question to a bounded set of enabled AI models, gathers their real answers, and returns **one final synthesized message**. The final answer should distinguish agreement from meaningful disagreement and must never invent a response from a model that timed out or failed. If some models fail, continue with the successful responses and briefly report partial coverage. The user should not have to manage separate model chats.

## Phase 1 — ship the chat/network first
1. **Secure API for Android:** define a stable server endpoint with Supabase user authentication on every request. Do not treat internal TanStack server-function transport as a public API without an explicit contract. Provider keys stay server-side.
2. **Multi-model coordinator:** start with a small, configurable number of verified models in parallel, with timeouts, concurrency and cost caps. Collect actual model outputs and failures, then ask a configured manager model to synthesize one answer. Keep model IDs/results internally for audit/debugging; show one user-facing answer.
3. **Real provider coverage:** inventory the provider configuration and test each model path. Classify models as working, unavailable, or unverified. The target is 162 models, but catalog entries do not count as working without successful real requests. Expand from a small reliable set only after evidence.
4. **Native Android chat:** connect the native chat UI to the secure endpoint; support same-account sign-in/session, one final answer, conversation history/sync where backend support and permissions are verified, loading/errors/timeouts, and retry without duplicate messages.
5. **Security and regression tests:** verify authenticated/unauthenticated requests, attachment ownership if used, provider quota ordering, rate/cost limits, partial model failures, synthesis, and no secret leakage.
6. **Build and test:** run a current Android CI build, download the artifact from that exact successful run, and smoke-test login + multi-model answer on Android 10. Do not label an old artifact as current or claim success without evidence.

## Phase 2 — only after the user confirms Phase 1 works
- Design and implement a registry capable of up to 500 commands, with schemas, validation, permission checks, audit logs, cost/rate limits, and tests. Do not claim 500 commands exist until implemented and tested.
- Then add 100 tested skills.
- Then add 50 documented workflows and external integrations/connectors.
- Other pages, including assistants/team and employees, are deferred until the user validates the core chat/network.

## Constraints
- GitHub `main` is the source of truth for the web app and existing backend contracts.
- Never put privileged Supabase keys or model-provider secrets in the APK, source, or chat.
- Preserve user isolation and RLS; inspect before changing production security.
- No fake responses and no pretending a configured name is a working model.
- Target Android 10 / API 29 and low-memory devices where feasible.
- Daily work should complete one small, high-value, testable code change. Record commit, test/CI evidence, PASS/FAIL/BLOCKED, and the next blocker in GitHub/TickTick. Documentation-only work does not substitute for implementation when a safe code change is possible.

## Known blockers
- Native Android chat currently calls `LocalAgentController`, so cloud model connectivity is not established.
- Web `askAssistant` currently tries models sequentially and returns the first successful answer; it does not yet gather multiple model opinions into one synthesized answer.
- `QwenEngine.load()` returns false and does not prove local inference works.
- `src/lib/models30.ts` lists 50 network models plus a manager model; this does not prove 162 operational models.
- PR #18 is still a draft security change. The reported workflow passed auth-policy structural checks and web build, not end-to-end provider/Storage tests or a current Android APK.
- GitHub Actions previously had missing Supabase configuration. If required secrets are absent, the repository owner must add them in repository settings; do not request or expose secrets in chat.
