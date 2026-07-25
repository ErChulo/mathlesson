# Phase 2 Mermaid Adapter Slice

Status: initial Mermaid renderer adapter implementation.

Branch: `migration/phase-2-mermaid-adapter`

## Subsystem

Renderer adapter infrastructure and Mermaid rendering.

## Baseline Behavior Preserved

The v4.9.22 baseline renders Mermaid diagrams from `pre.mermaid` source text, initializes Mermaid with `startOnLoad: false`, uses Mermaid major version `11`, preserves source separately from rendered SVG, rerenders from source on theme refresh, reports errors inline, guards duplicate initialization, and treats hidden-container rendering as a known risk.

This slice implements explicit-source Mermaid rendering in the React shell. It validates known diagram starts, renders source through Mermaid, preserves canonical source on the host and export path, records diagnostics for invalid or failed renders, prevents duplicate initialization for unchanged source, rerenders when source or theme changes, sanitizes generated SVG for scripts and inline event handlers, and cleans generated SVG on unmount.

## Dependency Version

Baseline audit evidence records Mermaid as the `11` major line in `docs/audit/dependency-inventory.md`.

This slice installs exact-pinned `mermaid@11.16.0`, the resolved npm `11.x` package at implementation time, to avoid broad or floating renderer dependencies while staying on the baseline major line.

## Affected Files

| File | Purpose |
| --- | --- |
| `package.json` | Exact-pinned Mermaid dependency |
| `package-lock.json` | Locked Mermaid dependency graph |
| `src/renderers/mermaid/mermaidAdapter.ts` | Mermaid adapter validation, mount, update, export, diagnostics, SVG sanitation, and cleanup |
| `src/renderers/mermaid/mermaidAdapter.test.ts` | Adapter lifecycle and diagnostic tests with a fake renderer |
| `src/components/renderers/MermaidBlock.tsx` | React host for explicit Mermaid source blocks |
| `src/components/renderers/MermaidBlock.test.tsx` | React host rendering, rerender, and diagnostic tests |
| `src/app/App.tsx` | Shell wiring for the approved Mermaid demo block only |
| `src/app/phaseOneData.ts` | Explicit Mermaid demo source data |
| `src/styles/app.css` | Shell-level Mermaid host styling |

## Tests Run

Required verification for this slice:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
node tools/analysis/verify-phase-0.mjs
```

Focused test coverage includes valid Mermaid render, invalid source diagnostics, render error diagnostics, rerender with changed source, cleanup on unmount, source preservation for export, duplicate initialization guard, hidden-container diagnostic, SVG sanitation, and validation result shape.

## Limitations

This slice does not migrate baseline-wide `pre.mermaid` scanning across arbitrary imported or authored HTML. It renders explicit React-owned Mermaid source blocks only.

This slice does not migrate MathLive, quizzes, inline exercises, import/export, print/PDF, Reveal export, student export, JSXGraph, Plotly, Plotly Explore, Arquero, SVG, Manim/video placeholders, calculators, statistics engines, CodeMirror, or GSAP behavior.

Exact visual parity with v4.9.22 Mermaid output still requires manual review because the baseline CDN uses the Mermaid `11` major line rather than an exact package version.

## Manual Tests

Manual parity checklist item RND-003 remains required before claiming full Mermaid parity across lesson content, theme refresh, navigation away/back, source preservation, and mobile width behavior.

Mobile review should verify large or left-to-right diagrams remain scrollable and do not corrupt the preserved diagram source.

## Next Adapter Recommendation

Proceed to the SVG adapter next because it is a native-browser renderer with no new third-party dependency and can further exercise source preservation and mobile scaling without touching MathLive.
