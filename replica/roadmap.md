# AbanoubAI Implementation Roadmap
**Date:** 2026-11-16  
**Branch:** `product-recon-20261116`  
**Rule:** Each phase has exit evidence; do not mark a phase complete because a catalogue row or UI control exists.

## Phase 0 — Baseline and security (current)
- [x] Read AGENTS.md and relevant Replica Skill instructions.
- [x] Inspect repository tree, model registry, assistant routes, model adapters, Android project, and project status records.
- [x] Create initial screen inventory and feature evidence matrix.
- [x] Research official public capabilities for target products.
- [x] Create target architecture for separate web and Android clients.
- [ ] Inspect all tool handlers and Supabase RLS policies.
- [ ] Resolve authentication/attachment ownership issue with regression tests.
- [ ] Replace prompt-only tool approval with deterministic policy enforcement.
- [ ] Verify every enabled model ID and modality against provider APIs.
- [ ] Verify current GitHub Actions state and production signing approach.

**Exit:** security review is signed off; no known cross-user file access path; sensitive tools are policy-gated; model registry is evidence-backed.

## Phase 1 — Product UX and design system
- [ ] Map all existing web screens and Android native screens in detail.
- [ ] Create user journeys and wireframes for mobile and web independently.
- [ ] Choose AbanoubAI brand tokens and typography; do not reproduce competitors' trade dress.
- [ ] Build shared component specifications and accessibility checks.
- [ ] Review the design before implementation.

**Exit:** approved web and Android screen maps, design tokens, component states, responsive behavior, and navigation model.

## Phase 2 — Core chat and model routing
- [ ] Canonical conversation API and authenticated persistence.
- [ ] Streaming, cancel, retry, edit/resend, and stop generation.
- [ ] Server-owned model catalogue with provider health and modality validation.
- [ ] Cost/latency-aware routing and bounded fallback.
- [ ] User-selectable model and visible fallback explanation.
- [ ] File pipeline with owner checks and format-aware parsing.

**Exit:** end-to-end chat tests pass from both independent clients, including provider outage and unauthorized attachment tests.

## Phase 3 — Agent/work mode
- [ ] Typed task plans and run timeline.
- [ ] Specialist agent profiles and reusable skills.
- [ ] Bounded concurrency, budget and deadlines.
- [ ] Typed tool registry and deterministic policy engine.
- [ ] Exact-action approvals, stop/pause/cancel/resume.
- [ ] Result verification and artifact handoff.

**Exit:** multi-step tasks pass acceptance tests; all tool calls are authorized and audited.

## Phase 4 — Research and browser
- [ ] Search connector with citations and retrieval timestamps.
- [ ] Source library and evidence/claim linking.
- [ ] Browser session with progress, screenshots where appropriate, and user takeover.
- [ ] Prompt-injection defenses and domain/session permissions.
- [ ] Parallel research with bounded subtasks and source reconciliation.

**Exit:** research benchmark demonstrates source coverage, accurate citations and safe browser actions.

## Phase 5 — Projects, files, memory and automation
- [ ] Project-level instructions and knowledge.
- [ ] File library, artifacts and revision workflow.
- [ ] User-controlled memory lifecycle.
- [ ] Scheduled jobs and event triggers with test runs and run history.
- [ ] Pause, cancel, retry and notification preferences.

**Exit:** account-isolation, retention, schedule reliability and artifact tests pass.

## Phase 6 — Connectors and coding workspace
- [ ] User-authorized connectors and MCP tool discovery.
- [ ] Read/write scopes and connection revocation.
- [ ] GitHub issue-to-branch-to-CI-to-PR workflow.
- [ ] Isolated work branches; no automatic merge or deployment without explicit approval.
- [ ] Integration health and audit.

**Exit:** connector scope tests and end-to-end GitHub workflow pass.

## Phase 7 — Independent Android client
- [ ] Native home/chat/navigation and account sign-in.
- [ ] Shared API contracts, conversation sync and offline cache.
- [ ] Voice input/output and notifications.
- [ ] User-enabled Accessibility service with visible controls and emergency stop.
- [ ] Permission lifecycle and OPPO/ColorOS device testing.
- [ ] Production signing and release verification.

**Exit:** APK works on target device without WebView dependency; offline and online behavior are separately tested; release signature is production-grade.

## Phase 8 — Quality and release
- [ ] Automated unit/integration/E2E tests.
- [ ] Accessibility and responsive audits.
- [ ] Security review, RLS tests, secret scan, dependency audit.
- [ ] Provider failure, rate-limit and cost-budget tests.
- [ ] Observability and incident runbooks.
- [ ] Release notes, privacy policy, terms and support process.

**Exit:** no open critical/high security issues; all must-have tests pass; deployment approved by the user.

## Current blockers (confirmed from inspected source)
1. `askAssistant` needs a full auth/attachment-ownership audit; its handler uses `supabaseAdmin` and accepts attachment paths from client input.
2. Capability catalogue prompt says execute without approval except marked commands; prompt text cannot be the authorization boundary.
3. `QwenEngine.kt` is explicitly cloud-only and returns `load() = false`.
4. Android `MainActivity.kt` currently opens the dashboard in a WebView; this must be replaced for the independent native-client requirement.
5. Android Gradle release signing currently references the debug keystore; do not distribute this as a production release.
6. Hard-coded model IDs and provider mappings require live verification.
7. Current broad multi-model/team fan-out needs cost and concurrency limits.

## Work completed in this phase
- Reconnaissance and competitor capability benchmark documents created.
- Proposed architecture and roadmap created.
- All changes are on `product-recon-20261116`; `main` was not modified.
