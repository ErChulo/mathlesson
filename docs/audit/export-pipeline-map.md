# Export Pipeline Map

| Pipeline | Source data | Validation and diagnostics | Transformation | Dependency/CDN inclusion | Source mutation risk | Author-only UI removal | Filename rules | Evidence | Regression severity | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lesson JSON export from editor | `edLesson` | `runExportPreflight("json")`, schema report | `buildLessonExportPayload` normalizes sections, quiz, functions, block inventory, tool adapters, schema validation | No runtime dependencies embedded except helper metadata and function strings | `exportedAt` timestamp is nondeterministic; Mermaid rendered output warning | Editor UI not included | `(payload.title).replace(/[^a-z0-9]/gi,"_") + ".json"` | `_inline.v4.9.22.mjs:3100-3132`, `4078-4087` | High | High |
| Active lesson JSON export | Current `lesson`, source built-in or user | Same as JSON | Same as editor export | Same | Built-in templates converted to content; function registries stringified | App UI not included | Same JSON filename rule | `_inline.v4.9.22.mjs:4089-4096` | High | High |
| Lesson JSON import | User `.json` files | JSON parse, `normalizeImportedLesson`, fingerprint duplicate detection, schema actionable messages | Saves normalized lesson under generated key and boots last imported | None | Mermaid sanitize may repair persisted rendered Mermaid | N/A | User file name only affects generated key hash | `_inline.v4.9.22.mjs:4036-4064`, `5864-5929` | Critical | High |
| Student lesson export | Editor lesson or active lesson | `validateStudentExport` via `runExportPreflight("student")` | `buildStudentExportPayload` then `buildStudentLessonHTML` and `downloadStudentLesson` | Generated HTML includes CDN dependencies for app runtime, MathLive CSS, renderer libraries, statistics libs, etc. | Payload includes `exportedAt`; generated runtime duplicates main logic; source HTML embedded | Author workspace/editor/planners not included in student runtime | Student options says `<lesson title>.<version number>.html`; actual function must be verified in lines after `5764` | `_inline.v4.9.22.mjs:4617-4712`, `5764-5829` | Critical | High |
| Reveal presentation export | JSON payload | `revealDiagnostics` and planner | `buildRevealDeckHTML` splits sections into slides and embeds runtime | Reveal.js, KaTeX, Plotly, Arquero `latest`, Mermaid, JSXGraph, simple-statistics, jStat | `appCSS` copied from live style tags; source includes generated slide HTML; Plot functions serialized | Main author UI not included; slide CSS extracted from app | `revealSlug(title) + ".reveal.html"` | `_inline.v4.9.22.mjs:4233-4447` | High | High |
| Print/PDF | Current DOM and payload | `buildPrintDiagnostics`, print planner | `prepareAllLessonPanelsForPrint`, force render hidden panels, add print classes, call `window.print` | Uses live app dependencies already loaded | Hidden panel render may mutate live DOM flags/classes | Author UI controlled by print CSS, not fully audited | Browser print dialog output | `_inline.v4.9.22.mjs:3920-4231`, `7715-7725` | High | High |
| Renderer asset inclusion | Tool adapter registry and generated templates | `buildToolAdapterInventory` checks dependency readiness | Export runtimes include subsets of renderer initialization code | CDN strings in generated HTML | Renderer source can be replaced in live DOM; export must use canonical lesson content | Export runtime excludes author-only controls | N/A | `_inline.v4.9.22.mjs:3136-3189`, `4335-4392`, `5422-5439` | High | High |

## Import/Export Round-Trip Requirements

1. JSON export -> import -> JSON export preserves section content, quiz fields, plots/tables function strings, structured schema diagnostics, and unknown/fallback blocks.
2. Mermaid source must remain source text, not rendered SVG.
3. JSXGraph inline scripts and named registry functions must survive student and Reveal exports.
4. Plotly legacy function registries and Explore data attributes must survive export/import.
5. Student export must preserve MathLive keyboard behavior independently of the author app.
6. Print and Reveal exports must initialize visual renderers only after containers have usable size.

## Generated Filename Observations

| Export | Filename evidence | Notes |
| --- | --- | --- |
| JSON | `_inline.v4.9.22.mjs:4066-4075` | Sanitizes title to underscores and appends `.json` |
| Reveal | `_inline.v4.9.22.mjs:4424-4434` | Slug lowercases and appends `.reveal.html` |
| Student | Student options at `4628-4636`; download function located after `5764` | Need exact filename verification in Phase 1/5 tests |

## Source Mutation Risks

| Risk | Evidence | Prevention |
| --- | --- | --- |
| Mermaid rendered DOM saved instead of source | `sanitizeMermaidBlocksInHTML` `3457-3472`; JSON warning `4139` | Store source model separately and test round trips |
| Arquero script replaced by rendered body in live DOM | `initArqueroBlocks` rewrites `wrap.innerHTML` at `1151-1166` | Export from lesson source, not live DOM |
| JSXGraph inline script lost when wrapper is replaced with board div | `initJSXGraphs` rewrites `wrap.innerHTML` at `7498-7504` | Preserve renderer source before initialization |
| Plotly data flag prevents rerender after content/source change | `data-injected` in `1107-1122` | Adapter source hash and cleanup before rerender |
| Export timestamps prevent deterministic golden files | `exportedAt: new Date().toISOString()` at `3105`, `4623` | Golden tests should normalize timestamps or allow injection |
