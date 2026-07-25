# Phase 1 Shell Notes

Status: initial React shell scaffold.

Branch: `migration/phase-1-shell`

## Scope Implemented

| Area | Phase 1 behavior |
| --- | --- |
| App scaffold | Vite, React, TypeScript, Vitest, jsdom, Testing Library, exact pinned npm versions |
| Shell layout | Sidebar, topbar, content panel host, responsive mobile sidebar, wide/standard content toggle |
| Navigation | Static placeholder lessons and panels that mirror the future migration destinations |
| Persistence | Baseline-compatible shell keys: `ml_lesson`, `ml_section_{lessonKey}`, `ml_theme_v1`, `ml_workspace_layout_v1`, `ml_advanced_nav_open` |
| Theme | Dark/light toggle stored as legacy JSON string |
| Reduced motion | `prefers-reduced-motion` detection stored on the document as shell context |
| Tests | Persistence compatibility and shell interaction tests |

## Explicit Non-Scope

Phase 1 does not migrate KaTeX, MathLive, Plotly, Mermaid, JSXGraph, Arquero, SVG/video renderer logic, quiz, inline exercises, authoring, import/export, print, Reveal, student standalone export, CodeMirror, calculators, statistics engines, or GSAP animation behavior.

The React shell does not import from `legacy/` or `analysis/`.

## Verification

Run from the repository root:

```bash
npm run check
```

Phase 0 verification remains available with:

```bash
node tools/analysis/verify-phase-0.mjs
```

Use `node tools/analysis/verify-phase-0.mjs --strict-boundary` only on the Phase 0 branch, where `src/` and `package.json` should not exist.

## Follow-Up Before Phase 2

1. Execute the manual baseline checklist in `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` with desktop and real iPhone evidence.
2. Define renderer adapter contracts and fixture inputs before attaching third-party renderer libraries to React containers.
3. Decide whether Phase 2 should install renderer dependencies one subsystem at a time or as a pinned parity bundle.
