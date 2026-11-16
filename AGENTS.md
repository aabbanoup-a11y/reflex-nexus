<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- AI network: 30-model registry in src/lib/models30.ts; cf/* models run on Cloudflare Workers AI via connector (not Lovable credit); GitHub writes only to branch ai-team, merge needs signed-in user click — keeps originals safe.
- Authentication uses Lovable Cloud email/password plus managed Google; GitHub is a repository connector, not an app sign-in provider — prevents invalid-provider OAuth failures.
- User-facing identity data lives in public.profiles with owner-only RLS — keeps profile data separate and private.


## Replica Skill workflow pack
- Before app analysis, reverse-engineering, architecture, UI/design, implementation, backend, QA, parity, competitor research, branding, launch, or deployment tasks, read the matching workflow under `docs/replica-skill/` (start with its `README.md`).
- Treat the vendored Replica Skill pack as the default reusable methodology for these tasks; do not wait for the user to name it again.
- Use clean-room implementation: study public behavior and user-authorized accounts only; never bypass paywalls/authentication or copy proprietary source, private APIs, assets, logos, or protected copy.
- Verify findings with dated sources, distinguish observed facts from inference, and never claim an implementation or test succeeded without evidence.
- Keep the web page and Android companion as separate clients over explicitly shared backend services; evaluate feature parity per platform rather than assuming one UI serves both.
- Preserve existing Lovable branch/history safety rules above. Ask before production-impacting changes or deployment.
