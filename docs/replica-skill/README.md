# Replica Skill — vendored workflow pack

This directory vendors the **11 workflow instructions** from [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill) so AbanoubAI agents can reuse them consistently.

## Included workflows
- `replica-recon`: map public features, screens, user flows, and evidence.
- `replica-architect`: plan architecture, schema, and API.
- `replica-design`: derive accessible design tokens and component specs.
- `replica-build`: implement original screens and behavior.
- `replica-backend`: implement backend integrations using official APIs.
- `replica-test`: test flows, states, accessibility, and regressions.
- `replica-diff`: measure feature and visual parity honestly.
- `replica-entrepreneur`: research public feedback and product gaps.
- `replica-brand`: establish an independent brand.
- `replica-launch`: prepare positioning, pricing, listings, and launch.
- `replica-deploy`: run production preflight and deployment checks.

## Usage
Read the relevant `SKILL.md` before a matching task. Default sequence:
`recon → architect → design → build → backend → test → diff → entrepreneur → brand → launch → deploy`.

This vendors the instruction pack, not an executable runtime or the original slash-command interface. Helper scripts/dependencies are not included unless separately reviewed and added.

## AbanoubAI guardrails
- Use public product information and accounts the user owns or is authorized to access.
- Never bypass subscriptions, paywalls, authentication, rate limits, or technical protections.
- Never copy source code, private APIs, proprietary assets, logos, licensed media, or protected copy.
- Rebuild general functionality and UX patterns independently with AbanoubAI's own brand.
- Use official public APIs and user-owned credentials; never commit secrets.
- Record source URL, access date, plan/tier, and evidence; distinguish observed facts from inference.
- Do not modify production services, publish, or deploy without required user approval.
- Never claim implementation or tests succeeded without reproducible evidence.
- Keep Android and web as separate clients over intentionally shared backend services.

## Upstream and license
- Upstream: https://github.com/Jakeschincariol/replica-skill
- License: MIT. See [LICENSE](./LICENSE). Original copyright and license notice are retained.
