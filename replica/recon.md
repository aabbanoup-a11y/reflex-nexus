# AbanoubAI Product Reconnaissance
**Date:** 2026-11-16  
**Repository baseline:** `main` at `676b25528667f3f9f8ca3de3ff6ac952560f2979`  
**Working branch:** `product-recon-20261116`  
**Method:** Replica Skill `replica-recon`; public product research + repository source inspection.  
**Status:** Initial recon, not a full device/browser QA pass.

## Product scope
Build AbanoubAI as a first-party AI assistant product, not a UI wrapper that merely forwards prompts to a single model.

- **Android:** independent native Android client, with its own navigation and native capabilities.
- **Web:** independent web client with its own responsive information architecture.
- **Shared backend:** authenticated identity, conversations, files, memory, model routing, agent orchestration, tools/connectors, audit events, and scheduled jobs where appropriate.
- **Core promise:** one assistant entry point that can answer, research, work with user files, plan and execute multi-step tasks, delegate to specialist agents, use approved tools, and verify results.
- **Competitive inspiration:** public capabilities and UX patterns from ChatGPT, Claude, Manus, Microsoft Copilot, and GitHub Copilot. Implement independently; do not copy proprietary code, private APIs, brand assets, protected text, or model weights.
- **Build strategy:** preserve valuable existing functionality; do not rewrite from scratch.

## Repository evidence observed
The current tree contains:
- TanStack Start + React + TypeScript web app, route modules, UI components, server functions, Supabase integration, and Cloudflare worker code.
- Existing routes include `/assistant`, `/chat`, `/network`, `/agent`, `/plugins`, `/projects`, `/history`, `/library`, `/images`, `/scheduled`, `/memory`, `/companion`, and `/paths-ui`.
- `src/lib/models30.ts` actually contains a registry described in its header as 50 network models plus a manager, with provider IDs for Cloudflare, Google, OpenAI, Anthropic and local models. Presence in this file does not prove every model ID is currently valid, enabled, affordable, or reachable.
- `src/lib/agent-skills.ts` defines a large phone-skill catalogue as command sequences. Catalogue presence is not proof every workflow is supported by the installed Android app.
- `src/routes/assistant.tsx` includes a manager/specialist assistant interface, attachments, local history, memory retrieval/suggestions, optional team mode, and fallback to local inference.
- `src/routes/network.tsx` supports model selection, single/limited/all-model modes, shared network messages, optional synthesis, and an execution path.
- `src/lib/chat.functions.ts` orchestrates model fallback, attachment loading, capability catalogue prompting, and response generation.
- `android-companion/` contains a Kotlin Android application, Accessibility service, command execution, local-agent controller, model catalog, voice controller, and a vendored llama.cpp tree.
- `cloudflare-worker/index.ts` and `cloudflare-worker/wrangler.toml` exist; actual production readiness must be checked separately.
- `supabase/migrations/` contains migrations for Android Companion, chat, catalogues, scheduled jobs, local-first agents, and security hardening.

## Important discrepancies and risks
1. **Product architecture direction changed:** older project notes describe a web page embedded in the Android APK. The latest product requirement is explicit: Android and web are separate clients. This recon treats the latest requirement as authoritative.
2. **Android runtime is not yet proven end-to-end:** `ANDROID_COMPANION_STATUS.md` says real OPPO/ColorOS device testing remains necessary. A native app directory and a successful CI build do not prove production behavior on the user's phone.
3. **Offline inference is not proven:** a historical audit says `QwenEngine.kt` was a cloud-only stub. Reinspect current code and test before claiming offline LLM support.
4. **Model registry integrity:** registry entries need provider/model ID validation against live official catalogues and actual credentials. Never display a model as available based only on a hard-coded ID.
5. **Cost and fan-out:** current team/all-model flows can call many models. Replace broad fan-out with task-based routing, bounded parallelism, budgets, cancellation, and explicit opt-in for expensive comparisons.
6. **Security blocker:** `askAssistant` in `src/lib/chat.functions.ts` uses server-side `supabaseAdmin` to read model catalogue and download attachment objects, but the inspected handler does not visibly enforce authenticated ownership of each supplied attachment path. Verify the full request/session path and add server-side ownership checks and auth tests before relying on it.
7. **Unsafe instruction in prompt construction:** the capability catalogue currently tells the model to execute requests without approval except for marked commands. This is not an adequate authorization system. Authorization must be enforced in deterministic server/tool code, not by model instructions. Sensitive, destructive, external-send, financial, publishing, permission, and account actions require explicit approval.
8. **No production modifications from this recon:** no Supabase data, secrets, deployment, or production configuration has been changed.

## Screen inventory (initial, from route tree)
| ID | Surface | Evidence | Purpose / observed scope | Status |
|---|---|---|---|---|
| W01 | Web assistant | `src/routes/assistant.tsx` | Chat with specialist assistants, attachments, memory and team mode | Code exists; full UX not browser-tested |
| W02 | Model network | `src/routes/network.tsx` | Choose/run models, compare outputs, synthesize, optionally execute | Code exists; live providers not verified |
| W03 | Chat route | `src/routes/chat.tsx` | New conversation landing placeholder | Placeholder observed |
| W04 | Agent | `src/routes/agent.tsx` | Agent workspace | Needs detailed inspection |
| W05 | Plugins | `src/routes/plugins.tsx` | Integrations/plugins management | Needs detailed inspection |
| W06 | Projects | `src/routes/projects.tsx` | Project context/workspaces | Needs detailed inspection |
| W07 | History | `src/routes/history.tsx` | Conversation/run history | Needs detailed inspection |
| W08 | Library | `src/routes/library.tsx` | User files/library | Needs detailed inspection |
| W09 | Images | `src/routes/images.tsx` | Image workflow | Needs detailed inspection |
| W10 | Scheduled | `src/routes/scheduled.tsx` | Scheduled tasks | Needs detailed inspection |
| W11 | Memory | `src/routes/_authenticated/memory.tsx` | User memory settings/data | Needs detailed inspection |
| W12 | Companion | `src/routes/_authenticated/companion.tsx` | Android device pairing/control | Needs detailed inspection |
| W13 | Paths | `src/routes/_authenticated/paths-ui.tsx` | Agent paths/workflows | Needs detailed inspection |
| A01 | Android native home/chat | `android-companion/app/src/main/java/.../MainActivity.kt` | Native app entry and local assistant | Code exists; device QA required |
| A02 | Android Accessibility runtime | `CompanionAccessibilityService.kt` | User-approved UI interaction | Permission/device QA required |
| A03 | Android command runtime | `CommandExecutor.kt`, `LocalAgentController.kt` | Execute allowlisted commands and plans | Security + device QA required |
| A04 | Android voice | `VoiceController.kt` | Speech input/output control | Needs detailed inspection |
| A05 | Android model catalog | `ModelCatalog.kt`, `QwenEngine.kt` | Local/cloud model selection | Offline capability unverified |

## Core user flows
- **F01 Ask:** user submits prompt → authenticated server request → model route/fallback → streamed or completed response → conversation saved.
- **F02 Research:** user asks current question → search/browser tools collect sources → evidence-backed synthesis → citations and source links.
- **F03 Files:** user attaches file → upload to user-owned storage path → server verifies ownership and type/size → capable model/tool processes it → answer references file accurately.
- **F04 Delegate:** manager classifies task → creates bounded subtask plan → selects specialists/models/tools → runs tasks with budget and cancellation → validates outputs → synthesizes one result.
- **F05 Execute tool:** model proposes structured tool call → deterministic policy/permission layer validates user, scope, risk, arguments and approvals → tool executes → audit event and evidence returned.
- **F06 Phone control:** user gives a phone task → Android native planner → allowlisted Accessibility action → observe screen/state → verify outcome → stop or request approval when needed.
- **F07 Memory:** user chooses memory behavior → retrieve only authorized user-scoped context → propose updates → user controls consent and deletion.
- **F08 Schedule:** user creates schedule/trigger → backend persists it → scheduler executes only within configured permissions → run log and pause/cancel controls.

## Non-goals / constraints
- Do not recreate proprietary foundation models; route to authorized provider APIs or open models with compatible licenses.
- Do not claim feature parity until tested.
- Do not silently send messages, publish content, spend money, delete data, alter permissions, or deploy.
- Do not bypass Android permissions, authentication, rate limits, paywalls, or provider restrictions.
- Keep web and Android as independent clients. Share contracts and backend services, not UI/WebView assumptions.

## Next step
Complete a focused code/security recon of the assistant, tool execution, auth, provider adapters, Android runtime and Supabase policies; then write the target architecture and phased implementation plan.
