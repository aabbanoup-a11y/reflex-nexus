# Native Network API bridge contract

Status: design/implementation gate. This document is not evidence that an endpoint already exists.

## Why a bridge is required
The web home route `/` renders `Network` from `src/routes/network.tsx`. It calls TanStack Start server functions `networkTurn` and `askAssistant`; these are server-side functions, not a stable public HTTP API for an Android app. The Android client must not be given Lovable gateway secrets or Supabase service-role credentials.

## Required public API
Implement a versioned authenticated endpoint on the existing trusted server runtime (or a Supabase Edge Function only if all required tools can safely run there). Recommended contract:

### POST `/api/mobile/v1/network/turn`
Request:
```json
{
  "model": "manager",
  "thread": [{"who":"user","text":"..."}],
  "mode": "execute"
}
```
Response:
```json
{
  "model": "manager",
  "text": "...",
  "tools": [],
  "usedModel": "..."
}
```

### POST `/api/mobile/v1/chat`
Request:
```json
{
  "system": "server-owned prompt id or safe bounded text",
  "messages": [{"role":"user","content":"..."}],
  "model": "server-allowlisted-model-id",
  "fallbacks": [],
  "attachments": [],
  "memories": []
}
```
Response:
```json
{"text":"...","model":"...","switched":false}
```

The server must own system prompts, model allowlists, tool execution and provider credentials. Never accept arbitrary credentials or privileged tool commands from the Android client.

## Security requirements
- Validate Supabase JWT/session server-side on every request; return 401 for absent/invalid session.
- Apply per-user rate limits and payload size/time limits.
- Apply Row Level Security to conversation, memory, attachment and device records.
- Attachment paths must be scoped to `u/<authenticated-user-id>/`; reject cross-user paths.
- Keep tool actions behind server-side authorization and explicit confirmation for consequential operations.
- Do not expose provider keys, Supabase service-role keys, Cloudflare tokens or GitHub tokens to the APK.
- Avoid logging prompts, access tokens or file contents in production logs.

## Native client requirements
- Store session tokens using Android Keystore-backed encrypted storage; clear them on sign-out.
- Use HTTPS and bounded timeouts; handle 401, 403, 429, 5xx and offline errors explicitly.
- Preserve request IDs and show visible progress/cancellation; do not retry side-effecting tool actions blindly.
- Keep history user-scoped and restore only after authentication.
- Attachments must be size/type checked and uploaded to the authenticated user's storage path.
- Add unit/integration tests for invalid JWT, expired session, cross-user reads/writes, rate limiting, oversized payloads and model allowlist enforcement.

## Blocking sequence
1. Implement and test the authenticated server endpoint using existing `networkTurn` / `askAssistant` logic without duplicating business logic.
2. Verify deployment runtime supports the required tool dependencies; do not move server-only code to Android.
3. Implement the native Network screen using the endpoint.
4. Test auth/RLS/attachments and build on CI.
5. Confirm on Android 10 and low-memory device before marking the route ported.
