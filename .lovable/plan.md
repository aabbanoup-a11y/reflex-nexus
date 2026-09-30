# Unified AbanoubAI app: login + phone + Chrome + 30 models

## What changed so far (summary for you)
- The site now uses its own Lovable Cloud database (the old one is disconnected), so old accounts are gone — you create a new account once.
- Email/password + Google sign-in work; GitHub sign-in was removed (GitHub is only for editing repositories).
- Chrome extension and Android companion exist but need manual pairing (copying IDs/tokens).

## Goal
Open the app on your Oppo -> sign in once -> the phone appears "connected" automatically, the 30 models are tied to your account, and your real Chrome (desktop) is controllable from the same page.

## Steps
1. **Login check** - re-test signup, sign-in, Google, and password reset end-to-end in the browser; fix anything that fails.
2. **Android app = the website** - the Android app opens the site full screen inside itself. When you sign in there, it automatically registers the phone as your device and starts listening for commands (no copying IDs or tokens). A clear "Stop" button and Accessibility permission screen remain; sensitive actions still need your approval.
3. **Phone status on login** - after sign-in, the home page shows "Your phone: connected/offline" and your Chrome status, with a shortcut to the control page.
4. **30 models tied to your account** - the 30-model page requires sign-in; conversations and each model's choices are saved to your account in the database (not only in the browser), so they appear on phone and PC alike. GitHub writing/merge only for you.
5. **Real Chrome control** - one-click pairing: the control page detects the installed extension and pairs automatically after sign-in.
6. **Build & publish** - rebuild the Android APK via the GitHub build workflow, publish the site.

## Limits (honest)
- I cannot install the APK or the Chrome extension on your devices; you install them once, after that everything is automatic.
- Android requires you to switch on Accessibility yourself once (system rule, cannot be bypassed).

## Technical details
- Android: `MainActivity` hosts a WebView of the published URL with a JS bridge (`AndroidCompanion.pair(session, userId)`); the page calls it after sign-in, upserts `companion_devices` (platform android) and stores the session for `CompanionRuntime` with token refresh.
- New table `network_messages` (user_id, author, model, content, created_at) with owner-only RLS + GRANTs; `/network` moves under `_authenticated`; `networkTurn` gets `requireCloudAuth`.
- Chrome: page calls `chrome.runtime.sendMessage(extId, {type:"ping"})`; extension ID stored in profile preferences.
