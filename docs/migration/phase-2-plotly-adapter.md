# Phase 2 Plotly Adapter Slice

Status: initial structured Plotly renderer adapter implementation.

Branch: `migration/phase-2-plotly-adapter`

## Subsystem

Renderer adapter infrastructure and base structured Plotly charts.

## Baseline Behavior Preserved

The v4.9.22 baseline loads Plotly `2.32.0`, defers hidden legacy plot initialization with `IntersectionObserver` and double `requestAnimationFrame`, resizes Plotly charts after theme/layout/print changes, purges inactive Plotly instances, and preserves chart source through function registries or widget HTML attributes.

This slice implements explicit structured Plotly source rendering in the React shell. It validates trace/layout/config source, dynamically imports the exact approved `plotly.js-dist-min@2.32.0` package, mounts visible charts through a provider boundary, defers hidden or zero-width containers, updates mounted charts through `Plotly.react`, applies theme relayout plus resize, preserves canonical source on host and export paths, skips duplicate initialization, reports diagnostics, and purges Plotly-owned state on cleanup.

## Dependency Version

`plotly.js-dist-min@2.32.0` is exact-pinned. This is the closest npm package to the v4.9.22 CDN dependency `https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.32.0/plotly.min.js` and supports the baseline 3D `surface` trace family needed by later Plotly Explore work.

The adapter intentionally uses a local structural Plotly interface instead of `@types/plotly.js` because no matching `@types/plotly.js@2.32.0` package exists.

## Affected Files

| File | Purpose |
| --- | --- |
| `package.json` / `package-lock.json` | Exact-pinned `plotly.js-dist-min@2.32.0` dependency |
| `src/types/plotly-js-dist-min.d.ts` | Minimal local module declaration for the untyped Plotly bundle |
| `src/renderers/plotly/plotlyAdapter.ts` | Plotly adapter validation, dynamic provider, mount, update, resize, export, duplicate-init guard, diagnostics, and cleanup |
| `src/renderers/plotly/plotlyAdapter.test.ts` | Fake-provider adapter lifecycle, validation, hidden-container, update, resize, cleanup, diagnostics, and source-preservation tests |
| `src/components/renderers/PlotlyBlock.tsx` | React host for explicit structured Plotly source blocks |
| `src/components/renderers/PlotlyBlock.test.tsx` | React host mount, update, diagnostic, and source-preservation tests |
| `src/app/App.tsx` | Shell wiring for the approved Plotly demo section only |
| `src/app/phaseOneData.ts` | Explicit structured Plotly demo source data |
| `src/styles/app.css` | Shell-level Plotly host styling |

## Tests Run

Required verification for this slice:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
node tools/analysis/verify-phase-0.mjs
```

Focused test coverage includes valid structured source validation, invalid source diagnostics, visible mount calls, hidden-container deferral, `Plotly.react` updates, theme relayout and resize, duplicate initialization guard, cleanup with `Plotly.purge`, export-source preservation, render-error diagnostics, and React host source preservation.

## Limitations

This slice renders explicit React-owned structured Plotly source blocks only.

This slice does not revive baseline `lesson.plots[key]` function strings, execute Plotly Explore `data-fn` expressions, migrate Plotly Explore controls, migrate statistics nested Plotly output, migrate import/export, migrate print/PDF, migrate Reveal export, or migrate student export behavior.

This slice does not migrate MathLive, quizzes, inline exercises, JSXGraph, Arquero, calculators, statistics engines, CodeMirror, or GSAP behavior.

The dynamically imported Plotly package is a large lazy chunk. ADR-0011 documents the accepted lazy Plotly budget and `npm run bundle:report` measures it after production builds.

## Manual Tests

Manual parity checklist item RND-002 remains required before claiming full Plotly parity across desktop, iPhone, 2D charts, 3D charts, Explore controls, and responsive layout changes.

## Next Adapter Recommendation

Plan Plotly Explore separately before implementation because Explore requires an explicit execution policy for baseline `data-fn` strings and slider-generated traces.
