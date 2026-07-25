# MathLesson v4.9.22 Baseline

Status: immutable evidence. Do not edit these files in place.

## Identity

Application version: `mathlesson.v4.9.22`

Source acquisition date: 2026-07-25

Source folder copied from: `/home/herick/Documents/mathlesson-development/mathlesson-v4.9.22-current-package`

Primary observed application file: `mathlesson.v4.9.22.html`

Analysis-only extracted JavaScript supplied with package: `_inline.v4.9.22.mjs`

## Preserved Files

| File | Role | SHA-256 |
| --- | --- | --- |
| `mathlesson.v4.9.22.html` | Original single-file app baseline | `9d10d5cceb55fafc173c742bf03324f9b851a58b66dfb7dbc42b304ff723c9b1` |
| `_inline.v4.9.22.mjs` | Supplied analysis copy of inline module JavaScript | `10e9a5bbc9fe56de6b89d4e5025b1dfb789ef5c9a397cc9306b6e58643a9ca14` |
| `README.md` | Version note and test target | `c6d663f611d47639690229701e472c865412ac853d5808908044cf74fc9d6058` |
| `START_HERE.md` | Manual smoke checklist | `546a7419b785e6e55edf98de3b58693caef8d53e1be801559ec12f56d17b0b46` |
| `read.txt` | Change summary and checklist notes | `a42edd279aa0e18f6b25087c58c896de1c1b58032b14cf94354b210a79e80a1f` |
| `next-shit.txt` | Migration handoff notes | `bde469a758e98861e144eaefd3810fbeea66c6c08ce0a776913a30690210a5aa` |

Complete hash file: `SHA256SUMS`.

Verification executed: `sha256sum -c legacy/mathlesson-v4.9.22/SHA256SUMS`, all six files returned `OK`.

## Known Required Runtime Conditions

Observed from `mathlesson.v4.9.22.html` and `_inline.v4.9.22.mjs`:

| Requirement | Evidence | Confidence |
| --- | --- | --- |
| Modern browser with ES modules | `_inline.v4.9.22.mjs:1-2` imports MathLive and Cortex Compute Engine from ESM CDNs | High |
| Network access to CDNs for full baseline functionality | `mathlesson.v4.9.22.html:8-44` loads KaTeX, GSAP, Plotly, Arquero, MathLive CSS, CodeMirror, Mermaid, JSXGraph, math.js, Nerdamer, simple-statistics, and jStat | High |
| `localStorage` availability for lesson state, notes, quiz answers, editor lessons, theme, layout, and student exports | `_inline.v4.9.22.mjs:592-634`, `2317-2348`, `4722-4746` | High |
| Browser file APIs for import/export | `_inline.v4.9.22.mjs:4066-4075`, `5864-5874`, `5906-5929` | High |
| Native MathLive keyboard must be available and hidden until explicit field interaction | `_inline.v4.9.22.mjs:193-263`, `264-319`; `README.md:9-14`; `START_HERE.md:3-11` | High |
| Browser print support for Print/PDF workflow | `_inline.v4.9.22.mjs:3920-4231`, `7715-7725` | High |

## Supported Workflows Observed

| Workflow | Evidence | Confidence |
| --- | --- | --- |
| Learner navigation through sections and table of contents | `_inline.v4.9.22.mjs:860-968`, `1040-1094`, `7107` | High |
| Quiz rendering, MC/TF/math/free answer checking, score persistence | `_inline.v4.9.22.mjs:1550-1662`, `1689-1840` | High |
| Inline exercise checking with hints and MathLive dismissal | `_inline.v4.9.22.mjs:1408-1529`, `6498-6545` | High |
| Author lesson editor with CodeMirror bridge | `_inline.v4.9.22.mjs:2405-2560`, `5993-6019` | High |
| JSON import/export with schema diagnostics | `_inline.v4.9.22.mjs:4036-4096`, `5812-5929` | High |
| Student standalone export | `_inline.v4.9.22.mjs:4450-4770`, `5812-5829` | High |
| Reveal presentation export | `_inline.v4.9.22.mjs:4233-4447` | High |
| Print/PDF planning and print preparation | `_inline.v4.9.22.mjs:3920-4231` | High |
| Renderer blocks for KaTeX, MathLive, Plotly, Mermaid, JSXGraph, Arquero, SVG, video, statistics | `_inline.v4.9.22.mjs:339-350`, `811-844`, `1144-1172`, `7289-7562` | High |

## Known Limitations And Risks

| Limitation | Evidence | Confidence |
| --- | --- | --- |
| Offline execution is incomplete because several runtime dependencies are loaded from external CDNs | `mathlesson.v4.9.22.html:8-44`; exports also embed CDN URLs at `_inline.v4.9.22.mjs:4406-4422` and `5764-5810` | High |
| Arquero is loaded with unpinned `@latest` in app and exports | `mathlesson.v4.9.22.html:13`, `_inline.v4.9.22.mjs:4416`, generated resource scan in `analysis/baseline-audit-v4.9.22.json` | High |
| MathLive itself is imported from `https://esm.run/mathlive` without an observed pinned version | `_inline.v4.9.22.mjs:1` | High |
| JSXGraph CDN references omit an explicit version | `mathlesson.v4.9.22.html:36-37`, `_inline.v4.9.22.mjs:4409`, `4418` | High |
| GSAP animations do not have observed `prefers-reduced-motion` gating in baseline source | `_inline.v4.9.22.mjs:1096-1100`, `1814-1821`; no `prefers-reduced-motion` text found by static search | Medium |
| Several renderers execute user-authored code strings using `new Function` or revived function strings | `_inline.v4.9.22.mjs:1111-1122`, `1164-1166`, `2603-2612`, `7487-7490` | High |
| Phase 0 has not executed real browser or iPhone manual tests | `README.md:17-19`, `START_HERE.md:3-12` document required manual tests only | High |

## Manual Acceptance Checklist Location

Current v4.9.22 checklist evidence is preserved in:

| File | Checklist scope |
| --- | --- |
| `START_HERE.md` | MathLive keyboard dismissal and JSXGraph smoke test |
| `README.md` | v4.9.22 MathLive hotfix test target |
| `read.txt` | Change summary plus manual testing checklist |

## Missing Expected Evidence

The following expected materials were not present in the supplied v4.9.22 package directory during Phase 0 setup:

| Missing material | Impact |
| --- | --- |
| `Briefing.txt` | Cannot cite briefing-specific requirements beyond the kickoff prompt |
| `mathlesson-v4.9.22-current-package.zip` | Cannot preserve ZIP-level artifact or verify ZIP integrity from inside repo |
| v4.9.22 lesson JSON samples | Schema inventory uses built-in lesson objects and historical nearby materials only as non-authoritative context |
| v4.9.22 stress-test lessons | Renderer stress risk remains unvalidated for v4.9.22 |
| screenshots and recordings | UI parity has no visual evidence yet |
| full manual test report | Manual acceptance state remains unproven |

## Immutable Evidence Statement

Files in `legacy/mathlesson-v4.9.22/` are preserved as v4.9.22 evidence. Do not modify them. Any derived copies or extractions must live under `analysis/` and must identify their source and extraction boundaries.
