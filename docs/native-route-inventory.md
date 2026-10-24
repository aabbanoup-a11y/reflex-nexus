# Web-to-native route inventory

Source audited from `main` at `6c8ab63b2adbaeadb11471669d24626e3e76b663`.
This is an inventory of the existing web app, not a claim that these routes are already native.

| Web route | Current implementation | Native migration status | Required parity checks |
|---|---|---|---|
| `/` | `src/routes/index.tsx` renders `Network` from `src/routes/network` | Not ported | Home layout, navigation, network/task actions, loading/error/empty states |
| `/auth` | `src/routes/auth.tsx`, Supabase auth and profile setup | Not ported | Sign-in, sign-up, password recovery, validation, session persistence |
| `/assistant` | `src/routes/assistant.tsx`, assistants/models, chat, memory, files, safety, voice | Not ported | Conversation flows, model selection, file handling, session, RTL, failure states |
| `/chat` | `src/routes/chat.tsx` | Not ported | New-chat entry and correct navigation |
| `/chat/$id` | `src/routes/chat.$id.tsx` | Not ported | Open saved conversation, messages, loading and error handling |
| `/history` | `src/routes/history.tsx` | Not ported | History list, opening items, empty/error states |
| `/images` | `src/routes/images.tsx` | Not ported | Image-generation UI, job states, result display and save/share |
| `/library` | `src/routes/library.tsx` | Not ported | Saved items, filtering, open/delete behavior |
| `/network` | `src/routes/network.tsx` | Not ported | Existing main dashboard UI and task/network workflows |
| `/plugins` | `src/routes/plugins.tsx` | Not ported | Integration listing, connection state, permissions and errors |
| `/projects` | `src/routes/projects.tsx` | Not ported | Project list/detail and persistence |
| `/remote` | `src/routes/remote.tsx` | Not ported | Remote-control status, safety confirmations and connectivity |
| `/scheduled` | `src/routes/scheduled.tsx` | Not ported | Scheduled tasks, status, edits and timezone behavior |
| `/agent` | `src/routes/agent.tsx` | Not ported | Agent workflow and explicit approval for consequential actions |
| `/reset-password` | `src/routes/reset-password.tsx` | Not ported | Password reset completion and deep-link/session handling |
| `/_authenticated/companion` | `src/routes/_authenticated/companion.tsx` | Not ported | Device pairing, command states, supervised actions, stop control |
| `/_authenticated/memory` | `src/routes/_authenticated/memory.tsx` | Not ported | User-controlled memory view and deletion/edit flows |
| `/_authenticated/paths-ui` | `src/routes/_authenticated/paths-ui.tsx` | Not ported | Path/workspace screens and navigation |

## Shared dependencies to inventory before porting
- `src/components/UnifiedWorkspaceNav.tsx`, `ChatSidebar.tsx`, `DeviceLink.tsx`, `WorkspacePlaceholder.tsx`
- `src/hooks/useAuth.ts`, Supabase runtime client and auth helpers
- `src/lib/chat.functions.ts`, `ai.functions.ts`, `agent.functions.ts`, `memory.functions.ts`, `companion.functions.ts`, `network.functions.ts`, `scheduler.functions.ts`
- `src/styles.css`, shared UI components under `src/components/ui`, language and RTL behavior

## Native implementation order
1. App shell/navigation + theme/RTL, then auth/session.
2. Main `/` (Network) screen and shared navigation.
3. Assistant/chat and conversation history.
4. Library/images/projects.
5. Scheduled tasks, plugins, agent and remote control.
6. Companion/device pairing and memory screens.
7. Password reset/deep links, accessibility, offline/error states and device QA.

## Release gate
Each row must be changed from **Not ported** only after a native screen exists and its acceptance checks have evidence. No WebView or external browser is an acceptable substitute for an unported route. Verify Android 10, small-screen/RTL layout, low-memory startup, authenticated Supabase requests and row-level security before release.
