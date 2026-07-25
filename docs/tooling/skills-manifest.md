# Skills Manifest

Installation date: 2026-07-25

Telemetry setup: commands were run with `DISABLE_TELEMETRY=1`.

Discovery check: `npx skills list --json -a opencode` lists all seven requested skills with `scope: project` and `agents: ["OpenCode"]`.

Frontmatter check: all installed `SKILL.md` files start with YAML frontmatter and their declared `name` matches their project-local directory name.

Security note: skills run with full agent permissions when loaded. During Phase 0, design skills are limited to audit/planning and must not override baseline behavior.

| Skill | Source repository | Installed path | Revision or version | Intended use | Security/permission notes |
| ----- | ----------------- | -------------- | ------------------- | ------------ | ------------------------- |
| `find-skills` | `https://github.com/vercel-labs/skills.git` | `.agents/skills/find-skills` | HEAD `e173b8c88f2581cfdaa1b6767c6519a08155790e`; lock hash `b146008599c31057cef1c145774cea5d5afb30e8f43fa802e47a4b461419aaaf` | Identify narrowly relevant missing capabilities; do not auto-install more skills without approval | Skills CLI reported Safe generation risk and Med Snyk risk. The originally requested `vercel-labs/agent-skills --skill find-skills` command failed because that repository currently did not contain `find-skills`; project-local install used the discoverable source already reported by global OpenCode skill listing. |
| `vercel-react-best-practices` | `https://github.com/vercel-labs/agent-skills.git` | `.agents/skills/vercel-react-best-practices` | HEAD `7c180d9044c9ae2b442b567aad4e42a28dd5ed62`; lock hash `ca7b0c0c6e5f2750043f7f0cd72d16ac4e2abc48f9b5500d047a4b77a2506212`; frontmatter version `1.0.0` | React composition, render performance, bundle review, effect/event boundaries | Skills CLI reported Safe generation risk, 0 Socket alerts, Low Snyk risk. Use after baseline preservation; do not optimize away preserved behavior. |
| `improve-codebase-architecture` | `https://github.com/mattpocock/skills.git` | `.agents/skills/improve-codebase-architecture` | HEAD `ed37663cc5fbef691ddfecd080dff42f7e7e350d`; lock hash `66e8a50c83c3c724fcfe0769701b665c56cec220cc4f49cc1aee8bdfc07de94a` | Identify deep-module opportunities and architecture seams | Skills CLI reported Safe generation risk, 0 Socket alerts, Low Snyk risk. Use for planning; avoid writing temp HTML reports into repo. |
| `ui-ux-pro-max` | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git` | `.agents/skills/ui-ux-pro-max` | HEAD `1307d97a72e6c1cda572cb65471ae5ce82995218`; lock hash `f0916ca326ad6dbde1d0770b46956a213406b8ea4a19ed931bb4f2dc7d04c16d` | Accessibility, mobile, touch, information architecture, responsive risk review | Skills CLI reported High generation risk, 0 Socket alerts, Low Snyk risk. Use only to document risks through Phase 5; no redesign during parity. |
| `impeccable` | `https://github.com/pbakaus/impeccable.git` | `.agents/skills/impeccable` | HEAD `af78b1e512148e2a2f2d2ded6786d265ea420191`; lock hash `702099286366bb9baaad1984d003b02fb33ee5cc8d396cd376928f5f674c3464`; frontmatter version `4.0.2` | Later visual critique and UI refinement after parity | Skills CLI reported Med generation risk, 0 Socket alerts, Med Snyk risk. Do not run hooks or live browser tooling without explicit approval. |
| `frontend-design` | `https://github.com/anthropics/skills.git` | `.agents/skills/frontend-design` | HEAD `b29e7cf65e5cb78a5ac33d582270551bc74a14eb`; lock hash `4eabc66183767153e404b39d1b839b1c37f2d82d86f0a0d7e880a579d8d62336` | Future visual direction after parity; design-system planning only during audit | Skills CLI reported Safe generation risk, 0 Socket alerts, Low Snyk risk. Must not override observed v4.9.22 behavior. |
| `grill-me` | `https://github.com/mattpocock/skills.git` | `.agents/skills/grill-me` | HEAD `ed37663cc5fbef691ddfecd080dff42f7e7e350d`; lock hash `f361db4e15e6bfd562a9282b1dccda513910a50061f9e838ce017be9c69dde3f` | Challenge unresolved architecture decisions before Phase 1 implementation | Skills CLI reported Safe generation risk, 0 Socket alerts, Low Snyk risk. Use for decision review; no autonomous implementation authority. |

## Validation Commands Run

| Command | Result |
| --- | --- |
| `npx skills add https://github.com/vercel-labs/agent-skills --skill find-skills --agent opencode -y` | Failed: no matching skill found; available skills listed did not include `find-skills` |
| `npx skills add ... --agent opencode -y` for the remaining requested skills | Installed six project-local skills |
| `npx skills add https://github.com/vercel-labs/skills --skill find-skills --agent opencode -y` | Installed `find-skills` project-locally |
| `npx skills list --json -a opencode` | Confirmed seven project-local skills |
| Node frontmatter validation command | Confirmed frontmatter exists and directory names match declared names |

## Open Issues

`find-skills` source differs from the kickoff command because the requested source repository did not contain that skill at installation time. The manifest records actual installed source and the failed requested-source attempt.
