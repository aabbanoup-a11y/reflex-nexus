# Public AI Product Capability Benchmark
**Research date:** 2026-11-16  
**Scope:** Publicly documented product capabilities, not internal implementation details. Feature availability may vary by plan, region, rollout, and connected accounts.

## Evidence-based observations

| Product | Publicly documented capabilities | AbanoubAI design implication |
|---|---|---|
| ChatGPT | Search, deep research, image input/generation, file/audio uploads, data analysis, voice, memory, projects, scheduled tasks and custom assistants (OpenAI Help Center). | Treat modalities, tools, projects, memory, and scheduled work as first-class capabilities with clear availability states. |
| ChatGPT agent | Can perform multi-step browser tasks, use connectors, narrate progress, allow interruption/takeover, and schedule recurring work (OpenAI announcement). | Provide a visible plan/run timeline, interruption, user takeover, connector permission boundaries and resumable tasks. |
| Claude | Long-running tasks, parallel tasks, scheduled tasks, voice, editable files/artifacts, interactive visuals, web search, connectors, browser/computer use, skills and permissions controls (Anthropic product overview). | Add reusable skills, artifacts, parallel subagents and approval/redirect controls. |
| Manus | Wide Research, browser operator, cloud computer, automations, projects, skills, MCP connectors and broad third-party integrations (Manus features/help). Wide Research is documented as parallel subtasks and currently paid-tier gated in its help article. | Build bounded parallel research and cloud task execution as optional modes; make cost/plan limits explicit. |
| Microsoft Copilot | Agents can combine generative AI, knowledge and actions; deploy across channels; hand off to other agents; use workflows, connectors, REST APIs and MCP. | Adopt a tool/connector abstraction and explicit agent-to-agent handoff contracts. |
| GitHub Copilot | Repository-aware agent work, parallel sessions, recurring automations, code review, PR lifecycle and integration with issues/Actions. | Treat coding as a specialist workflow with repository context, isolated work branches, test evidence, and review-before-merge. |

## Primary sources
- OpenAI capabilities overview: https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview
- OpenAI ChatGPT agent: https://openai.com/index/introducing-chatgpt-agent/
- Claude product overview: https://claude.com/product/overview
- Manus features: https://manus.im/features
- Manus Wide Research: https://help.manus.im/en/articles/11960169-what-is-wide-research
- Manus Automations: https://www.manus.im/features/automations
- Microsoft Copilot Studio agents overview: https://learn.microsoft.com/microsoft-copilot-studio/agents-overview
- Microsoft connector tools: https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors
- GitHub Copilot product: https://github.com/features/copilot
- GitHub Copilot surfaces: https://docs.github.com/en/copilot/get-started/where-to-use-github-copilot

## Product patterns worth adopting
1. **One front door, many execution modes:** Chat, Research, Agent/Work, Create, and Code should be clear modes backed by shared context.
2. **Plan visibility and control:** show task plan, current step, tool activity, outputs, errors, elapsed time, and stop/pause controls.
3. **Delegation with bounded concurrency:** specialist agents work on independent subtasks; manager checks evidence and reconciles conflicts.
4. **Skills as reusable workflows:** versioned skill definitions with triggers, required inputs, tool scopes, output contracts and tests.
5. **Connectors as typed tools:** user-authorized scopes, explicit identity, read/write distinction, and revocation.
6. **Artifacts as durable outputs:** files and interactive deliverables belong to a task/project and can be revised.
7. **Recurring automation:** schedule/trigger, test run, approval policy, run history, pause and retry.
8. **Trust and provenance:** citations, file references, model/provider identity, tool traces, and clear distinction between verified facts and inference.
9. **Developer-grade workbench:** repository-aware tasks, branch isolation, CI evidence, PR review and merge approval.
10. **Cross-device continuity without UI coupling:** web and Android independently consume shared backend contracts; Android adds native offline/phone capabilities.

## Do not copy
- Foundation-model weights or proprietary model behavior.
- Private endpoints, undocumented APIs, internal prompts, proprietary code.
- Logos, trade dress, screenshots as production assets, protected text, paid assets.
- Product names or UI that imply affiliation with the referenced vendors.

## Confidence and gaps
- Observations above come from official public product pages/docs, not hands-on testing of paid accounts.
- This benchmark does not prove every feature is available in Egypt or on the user's plan.
- Before implementing each feature, re-check its official API, pricing, regional availability, terms, and technical limits.
