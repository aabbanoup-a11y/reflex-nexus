# Native Android migration — Reflex Nexus

## Goal
Turn the existing Reflex Nexus **chat/network experience** into a usable Android app: one conversation UI connected to the full configured AI/model network (the user's target is 162 models), with the same account, shared conversation/data where supported, and safe server-side tool execution. This is not a request to port every website page. Projects, images, library, plugins, scheduler, remote control, and other separate routes are out of scope unless later requested. The chat/network screen must be real and functional, not a placeholder.

## Constraints
- The web app on `main` remains the source of truth for current screens and behavior.
- Keep existing Supabase/backend contracts; do not copy secrets into the client.
- Target Android 10 / API 29 and low-memory devices where feasible.
- Keep the existing companion capabilities only where implemented and permissioned; do not imply unavailable functions work.
- Do not replace or redesign the existing product. Native components should reproduce its screens and interaction patterns.
- Do not merge until CI passes and native/web feature parity is reviewed.

## Migration sequence
1. **Inventory (first gate):** enumerate routes, shared components, design tokens, auth/session behavior, data calls, forms, and key workflows from the current React/TanStack app. Record screenshots and acceptance checks for each route.
2. **Native foundation:** establish an Android-native screen/navigation architecture and shared API/data layer. Keep secrets server-side; use the Supabase publishable key only with proper RLS and authenticated sessions.
3. **Design-system parity:** port typography, colors, spacing, cards, buttons, inputs, dialogs, loading/empty/error states and RTL behavior. No new visual redesign.
4. **Chat + assistant team + employees:** implement the native chat/network screen, model/network selection, message thread, attachments if supported, progress/error states, and authorized tool actions. Also port the existing AI assistants/team page (web route `/assistant`, source `src/routes/assistant.tsx`) and the employees page requested by the user. First locate the canonical employees page/component and its data source in the repo; do not invent a route or mock an employee list. Preserve the existing website for all other sections; do not port unrelated routes.
5. **Feature parity checks:** validate authentication, navigation/back behavior, forms, data loading, file/media flows, language/RTL, and error handling.
6. **Build and device gate:** run Android CI, install the APK on Android 10, check memory/startup/crashes, and compare native screenshots against the reference web screens.
7. **Cutover:** only after parity is demonstrated, make the native app the primary mobile experience. Keep the web app available independently; never route the Android app out to a browser as a substitute.

## Acceptance criteria
- Main launch screen is native UI, not WebView.
- No button opens the web dashboard as a workaround for an unimplemented native route.
- The chat/network screen and assistant/team page have native UI and pass acceptance checks; the employees page is also in scope once its canonical web route/data source is identified. Unrelated website routes are explicitly out of scope.
- Auth/session and RLS are verified without exposing secrets.
- Android 10 build and on-device smoke test pass.
- Unimplemented routes are clearly tracked; do not claim full conversion prematurely.

## Current known state
The existing Android `MainActivity` starts a simplified native chat/setup UI. The web project uses React 19 and TanStack Start/Router. A full native port requires route/component inventory and staged implementation; changing the launcher alone is not conversion.


## Scope correction (2026-10-24)
The release target is **one chat/network experience**, not full website route parity. It must connect to the configured AI network (target: 162 models) through a secure authenticated backend, share the same account/session and persisted data where supported, and keep privileged keys server-side. Other website pages remain available on the website and are not release blockers. A model counts as connected only when its real provider/configuration and response path are verified; model count in UI alone is not evidence.


## Scope update (2026-10-24, user-confirmed)
In addition to chat/network, include the **AI assistants/team page** and the **employees page** in the Android app. The canonical assistant route is `/assistant` (`src/routes/assistant.tsx`). The employees route has not yet been identified from the inspected route files; locate it and its backing data before implementing so the native page uses real records and permissions rather than fake placeholders. All other website routes remain out of scope unless requested.
