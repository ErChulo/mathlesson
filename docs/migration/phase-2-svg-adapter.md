# Phase 2 SVG Adapter Slice

Status: initial SVG renderer adapter implementation.

Branch: `migration/phase-2-svg-adapter`

## Subsystem

Renderer adapter infrastructure and native SVG rendering.

## Baseline Behavior Preserved

The v4.9.22 baseline treats SVG as native inline DOM, preserves inline SVG in JSON and HTML exports, keeps it responsive through CSS, and repairs missing `viewBox` values from explicit width and height in quiz/student runtime paths.

This slice implements explicit-source SVG rendering in the React shell. It validates SVG markup, rejects non-SVG roots, removes script and inline event-handler risks, removes `javascript:` URL attributes, repairs missing `viewBox` from width and height, preserves canonical source on the host and export path, avoids duplicate initialization for unchanged source, rerenders when source changes, and cleans generated DOM on unmount.

## Dependency Version

No new dependency is installed. SVG rendering uses browser-native DOM APIs.

## Affected Files

| File | Purpose |
| --- | --- |
| `src/renderers/svg/svgAdapter.ts` | SVG adapter validation, sanitation, mount, update, export, duplicate-init guard, and cleanup |
| `src/renderers/svg/svgAdapter.test.ts` | Adapter lifecycle, sanitation, viewBox, and source-preservation tests |
| `src/components/renderers/SvgBlock.tsx` | React host for explicit SVG source blocks |
| `src/components/renderers/SvgBlock.test.tsx` | React host rendering, rerender, and diagnostic tests |
| `src/app/App.tsx` | Shell wiring for the approved SVG demo block only |
| `src/app/phaseOneData.ts` | Explicit SVG demo source data |
| `src/styles/app.css` | Shell-level SVG host styling |

## Tests Run

Required verification for this slice:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
node tools/analysis/verify-phase-0.mjs
```

Focused test coverage includes valid SVG render, invalid source diagnostics, script and event-attribute sanitation, `javascript:` URL removal, missing `viewBox` repair, rerender with changed source, cleanup on unmount, source preservation for export, duplicate initialization guard, and validation result shape.

## Limitations

This slice does not migrate baseline-wide `.svg-wrap` or arbitrary inline SVG scanning across imported or authored HTML. It renders explicit React-owned SVG source blocks only.

This slice does not migrate MathLive, quizzes, inline exercises, import/export, print/PDF, Reveal export, student export, JSXGraph, Plotly, Plotly Explore, Arquero, Manim/video placeholders, calculators, statistics engines, CodeMirror, or GSAP behavior.

The sanitation policy is intentionally conservative for this first explicit-source host. Broader authoring/import SVG policy may require a separate reviewed security decision before accepting arbitrary user SVG.

## Manual Tests

Manual parity checklist item RND-007 remains required before claiming full SVG/media parity across lesson content, generated exports, and mobile layouts.

Mobile review should verify fixed-size SVGs remain scrollable or responsive and do not create unusable horizontal overflow.

## Next Adapter Recommendation

Proceed to Manim/video placeholders next because they are native browser media elements and can exercise source preservation, responsive layout, load-error diagnostics, and cleanup without touching MathLive.
