# Phase 2 KaTeX Adapter Slice

Status: initial KaTeX renderer adapter implementation.

Branch: `migration/phase-2-katex-adapter`

## Subsystem

Renderer adapter infrastructure and KaTeX rendering.

## Baseline Behavior Preserved

The v4.9.22 baseline renders TeX/LaTeX with KaTeX, keeps source HTML as the durable source, avoids crashing on invalid math, rerenders after navigation or delayed content insertion, and avoids processing non-KaTeX renderer regions such as Mermaid, JSXGraph, code, SVG, and data blocks.

This slice implements an explicit-source KaTeX adapter for the React shell. It validates a `KaTeXSource`, renders with KaTeX, reports diagnostics for invalid TeX, avoids duplicate initialization for unchanged source, rerenders when source changes, cleans generated DOM on unmount, and exports the canonical source object for future export paths.

Invalid TeX renders a generic fallback in the live DOM. The canonical TeX remains available through the typed source object and future export paths, not by exposing raw TeX in the runtime DOM.

## Dependency Version

Baseline audit evidence records KaTeX `0.16.9` in `docs/audit/dependency-inventory.md`.

This slice uses exact-pinned `katex@0.16.47` instead of `0.16.9` because the required `npm audit --audit-level=moderate` gate currently reports moderate vulnerabilities for `katex 0.11.0 - 0.16.20`. The migration keeps the dependency on the KaTeX `0.16.x` line and documents this security-driven deviation.

## Affected Files

| File | Purpose |
| --- | --- |
| `package.json` | Exact-pinned KaTeX dependency |
| `package-lock.json` | Locked KaTeX dependency graph |
| `src/renderers/core/types.ts` | Minimal shared renderer adapter types |
| `src/renderers/core/diagnostics.ts` | Minimal diagnostics helpers |
| `src/renderers/core/lifecycle.ts` | Minimal lifecycle source tracking helpers |
| `src/renderers/katex/katexAdapter.ts` | KaTeX adapter validation, mount, update, export, and cleanup |
| `src/renderers/katex/katexAdapter.test.ts` | Adapter lifecycle tests |
| `src/components/renderers/KaTeXBlock.tsx` | React host for explicit KaTeX source blocks |
| `src/components/renderers/KaTeXBlock.test.tsx` | React host rendering and diagnostic tests |
| `src/app/App.tsx` | Shell wiring for the approved KaTeX demo block only |
| `src/app/phaseOneData.ts` | Explicit KaTeX demo source data |
| `src/styles/app.css` | Shell-level KaTeX host and diagnostic styling |

## Tests Run

Required verification for this slice:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
node tools/analysis/verify-phase-0.mjs
```

Focused test coverage includes valid block math render, valid inline math render, invalid TeX diagnostics with a safe non-source fallback, rerender with changed source, cleanup on unmount, source preservation for export, duplicate initialization guard, and validation result shape.

## Limitations

This slice does not migrate baseline-wide `renderMathInElement` auto-rendering across arbitrary HTML. It renders explicit React-owned KaTeX source blocks only.

This slice does not migrate MathLive, quizzes, inline exercises, import/export, print/PDF, Reveal export, student export, Mermaid, JSXGraph, Plotly, Plotly Explore, Arquero, SVG, Manim/video placeholders, calculators, statistics engines, CodeMirror, or GSAP behavior.

Exact visual parity with v4.9.22 KaTeX output still requires manual review against baseline pages because the package version is patched within the KaTeX `0.16.x` line.

## Manual Tests

Manual parity checklist item RND-001 remains required before claiming full KaTeX parity across lesson content, quiz stems, hints, calculators, statistics output, and exported runtimes.

Mobile review should verify long display equations do not create unusable horizontal overflow on iPhone portrait and landscape.

## Next Adapter Recommendation

Proceed to the Mermaid adapter next, preserving source text as canonical data and stopping if hidden-container or raw-source flash behavior requires broader architecture than the approved one-adapter slice.
