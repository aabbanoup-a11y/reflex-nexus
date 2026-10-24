# Native Android migration — Reflex Nexus

## Goal
Turn the existing Reflex Nexus web product into a real Android app with native screens, while preserving the current product's information architecture, visual design, copy, and user-visible workflows. This is **not** a WebView wrapper and must not open the web dashboard as the main app experience.

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
4. **Screen-by-screen port:** implement the highest-use routes first, with matching states and interactions. Reuse business rules and API contracts where possible; rebuild browser-specific UI as native Android UI.
5. **Feature parity checks:** validate authentication, navigation/back behavior, forms, data loading, file/media flows, language/RTL, and error handling.
6. **Build and device gate:** run Android CI, install the APK on Android 10, check memory/startup/crashes, and compare native screenshots against the reference web screens.
7. **Cutover:** only after parity is demonstrated, make the native app the primary mobile experience. Keep the web app available independently; never route the Android app out to a browser as a substitute.

## Acceptance criteria
- Main launch screen is native UI, not WebView.
- No button opens the web dashboard as a workaround for an unimplemented native route.
- All in-scope routes have an inventory row, native implementation, and pass/fail evidence.
- Auth/session and RLS are verified without exposing secrets.
- Android 10 build and on-device smoke test pass.
- Unimplemented routes are clearly tracked; do not claim full conversion prematurely.

## Current known state
The existing Android `MainActivity` starts a simplified native chat/setup UI. The web project uses React 19 and TanStack Start/Router. A full native port requires route/component inventory and staged implementation; changing the launcher alone is not conversion.
