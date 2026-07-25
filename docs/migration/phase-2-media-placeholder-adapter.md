# Phase 2 Media Placeholder Adapter Slice

Status: initial Manim/video placeholder adapter implementation.

Branch: `migration/phase-2-media-placeholder-adapter`

## Subsystem

Renderer adapter infrastructure and native browser media placeholders.

## Baseline Behavior Preserved

The v4.9.22 baseline treats Manim/video blocks as browser-native media. It ensures videos have controls, `preload="metadata"`, `playsinline`, a source-derived title, duplicate initialization protection through `data-ml-video-ready`, and a visible load-error note when a video cannot load.

This slice implements explicit-source media rendering in the React shell. It validates video or placeholder metadata, allows deferred placeholders without blocking navigation, mounts native `<video>` elements only when a URL is provided, preserves canonical media source metadata on the typed source and export path, guards duplicate initialization, defers `video.load()` for hidden containers, updates same-identity video metadata without replacing the element, reports load-error diagnostics, and pauses/removes adapter-owned media on cleanup.

Video load errors show a generic fallback note in the live DOM. The canonical media URL remains available through the typed source object and future export paths, not by exposing raw URLs in runtime failure text.

## Dependency Version

No new dependency is installed. Media rendering uses browser-native HTML media elements.

## Affected Files

| File | Purpose |
| --- | --- |
| `src/renderers/media/mediaAdapter.ts` | Media adapter validation, mount, update, export, duplicate-init guard, load-error diagnostics, and cleanup |
| `src/renderers/media/mediaAdapter.test.ts` | Adapter lifecycle, validation, hidden-container, load-error, update, cleanup, and source-preservation tests |
| `src/components/renderers/MediaBlock.tsx` | React host for explicit media/video placeholder source blocks |
| `src/components/renderers/MediaBlock.test.tsx` | React host placeholder, missing-media diagnostic, and invalid-source tests |
| `src/app/App.tsx` | Shell wiring for the approved media placeholder demo block only |
| `src/app/phaseOneData.ts` | Explicit Manim/video placeholder demo source data |
| `src/styles/app.css` | Shell-level media host styling |

## Tests Run

Required verification for this slice:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
node tools/analysis/verify-phase-0.mjs
```

Focused test coverage includes valid video source validation, native video attributes, placeholder rendering, missing-media warnings, invalid media types, invalid dimensions, safe load-error notes and diagnostics, hidden-container load deferral, same-identity metadata updates, cleanup, export-source preservation, and duplicate initialization protection.

## Limitations

This slice renders explicit React-owned media source blocks only. It does not migrate baseline-wide `.manim-slot` scanning, imported authored HTML media, student export runtime media behavior, Reveal export media behavior, print/PDF media fallbacks, or any media upload/blob ownership policy.

This slice does not migrate MathLive, quizzes, inline exercises, import/export, print/PDF, Reveal export, student export, JSXGraph, Plotly, Plotly Explore, Arquero, calculators, statistics engines, CodeMirror, or GSAP behavior.

The adapter does not revoke `blob:` URLs because this slice does not create object URLs. Future upload/import work should add explicit object URL ownership and cleanup rules.

## Manual Tests

Manual parity checklist item RND-007 remains required before claiming full SVG/media parity across lesson content, generated exports, and mobile layouts.

Mobile review should verify iPhone native controls, `playsinline`, safe-area spacing, load-error fallback text, and responsive placeholder sizing.

## Next Adapter Recommendation

Proceed to a similarly isolated native or low-dependency renderer slice only if its source shape and cleanup policy are clear. Do not start MathLive until real iPhone manual evidence hooks are ready.
