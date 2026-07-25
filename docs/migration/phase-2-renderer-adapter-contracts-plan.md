# Phase 2 Renderer Adapter Contracts Plan

Status: planning-only contract branch.

Branch: `migration/phase-2-renderer-adapter-contracts-plan`

This branch does not implement renderer adapters. It defines the contract, fixtures, test strategy, and acceptance criteria required before implementation.

## Explicit Non-Scope

This branch adds documentation and test-planning files only.

No renderer adapter implementation is added.

No MathLive migration is added.

No dependency installation is added.

No runtime renderer components are added.

No schema changes are added.

No preserved baseline files under `legacy/mathlesson-v4.9.22/` are modified.

## Goals

1. Define a common adapter lifecycle before any renderer implementation.
2. Identify renderer-specific baseline behavior, data shape, risks, fixtures, and manual evidence requirements.
3. Provide acceptance criteria that let Phase 2 implement one adapter at a time behind tests.
4. Preserve source data for authoring, export, print, and diagnostics even when runtime rendering fails.

## Source References

| Evidence | Use |
| --- | --- |
| `analysis/baseline-audit-v4.9.22.json` | Renderer counts, named functions, external resources, localStorage references |
| `analysis/extracted-v4.9.22/` | Extracted v4.9.22 inline source for implementation research |
| `docs/audit/rendering-lifecycle-map.md` | Baseline renderer order and lifecycle notes |
| `docs/audit/dependency-inventory.md` | Runtime libraries and CDN dependencies |
| `docs/audit/export-pipeline-map.md` | Export and print behavior that must not lose renderer source |
| `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` | Manual parity checks, including real iPhone MathLive and renderer checks |

## Adapter Contract Summary

The contract is documented in `docs/architecture/renderer-adapter-contract.md` as TypeScript-like pseudocode only. No production TypeScript files are created in this branch.

Each adapter owns validation, mount, optional update, optional resize, optional export, diagnostics, and unmount for one renderer family. React components in later implementation phases should provide stable containers and lifecycle events, but should not call third-party renderer libraries directly.

## Renderer Acceptance Requirements

### KaTeX

1. Baseline behavior to preserve: render inline and display formulas in lesson content, quiz stems, hints, calculators, and statistics output without corrupting code, Mermaid source, JSXGraph source, or raw text fallback.
2. Source data shape: raw TeX string plus display mode, trust option, throw-on-error option, original block id, and surrounding content context.
3. Validation requirements: require a string source, normalize empty strings to a diagnostic, reject non-string values, and preserve invalid TeX for fallback and export.
4. Container requirements: stable visible or soon-visible element with no reused children from another formula instance.
5. Initialization timing: run after the target content container is attached to the DOM and after text extraction has resolved source ranges.
6. Rerender behavior: rerender when source, display mode, theme-affecting classes, or owning content id changes; skip duplicate rerenders for unchanged source.
7. Cleanup behavior: remove adapter-owned rendered nodes and diagnostics while leaving source records untouched.
8. Resize/orientation behavior: generally no active resize is required, but display formulas must not overflow mobile width after orientation changes.
9. Hidden-container risks: hidden math may measure incorrectly if CSS applies layout-dependent wrappers; defer width-sensitive display checks until visible.
10. Duplicate-initialization risks: repeated DOM scans can double-render the same TeX span or replace already-rendered markup; require an adapter instance marker.
11. Source-preservation requirements: keep original TeX source and fallback text available for authoring, export, print, and diagnostics.
12. Export requirements: JSON export keeps original TeX; student, Reveal, print, and PDF paths must either rerender from source or include a safe static fallback.
13. Diagnostics/error reporting: report parse errors with block id, formula index, source excerpt, and renderer id without throwing a fatal shell error.
14. Test fixtures required: valid inline math, valid display math, invalid command, empty formula, formula inside quiz content, formula near code and Mermaid source.
15. Manual tests required: RND-001 plus export checks that confirm invalid formulas remain editable and visible as source/fallback.
16. Mobile risks: long display equations can overflow; tap targets near formulas must remain reachable in iPhone portrait and landscape.
17. Implementation phase: Phase 2 candidate after the generic host and diagnostics contract are accepted.

### MathLive

1. Baseline behavior to preserve: `math-field` inputs initialize only when intended, the native MathLive keyboard opens after explicit field interaction, and outside taps dismiss the keyboard without immediate reopen.
2. Source data shape: answer field id, initial LaTeX value, answer metadata, keyboard policy, persistence key, quiz or inline-exercise owner, and validation hooks owned by learner logic.
3. Validation requirements: require stable field id and string value, reject missing owner metadata, preserve unknown answer metadata for later quiz migration.
4. Container requirements: focusable field host with safe-area-aware mobile layout and no parent remount during keyboard interaction.
5. Initialization timing: initialize only after user-visible field host is attached; do not autofocus on page load or navigation.
6. Rerender behavior: update value only from explicit state changes; do not recreate fields while focused unless the owning question changes.
7. Cleanup behavior: blur active fields, remove listeners, clear active keyboard references, and avoid stale global focus state.
8. Resize/orientation behavior: recompute keyboard safe-area spacing and visible row after iPhone orientation changes.
9. Hidden-container risks: hidden or offscreen fields can steal focus or initialize keyboard geometry incorrectly.
10. Duplicate-initialization risks: duplicate listeners can cause keyboard flicker, repeated blur, or stale active field tracking.
11. Source-preservation requirements: preserve raw LaTeX answers and field metadata separately from rendered editor DOM.
12. Export requirements: exported student runtime must retain math input behavior and saved answer source without depending on React component internals.
13. Diagnostics/error reporting: report initialization, focus, keyboard, and validation diagnostics with field id, question id, input mode, and device class.
14. Test fixtures required: focused field, unfocused field, outside tap, submit/reset flow, navigation away/back, corrupt saved answer value.
15. Manual tests required: ML-001 through ML-009 on desktop and real iPhone Safari.
16. Mobile risks: iPhone safe-area spacing, keyboard row visibility, touch outside detection, orientation restore, and accidental autofocus are release blockers.
17. Implementation phase: later Phase 2 or Phase 3 only after real-device manual hooks are ready; not implemented by this planning branch.

### Mermaid

1. Baseline behavior to preserve: render diagrams from source text, rerender on theme changes when needed, and never replace the editable Mermaid source with generated SVG.
2. Source data shape: Mermaid source string, diagram id, theme context, security level, and owning block metadata.
3. Validation requirements: require non-empty string source, validate diagram id stability, record parser errors as diagnostics, and preserve invalid source.
4. Container requirements: empty stable container with deterministic id namespace to prevent clashes across sections and exports.
5. Initialization timing: run after container is visible or after a visibility gate confirms measurable layout.
6. Rerender behavior: rerender from original source on source or theme changes; never rerender from generated SVG.
7. Cleanup behavior: remove generated SVG and adapter markers while preserving source text.
8. Resize/orientation behavior: verify SVG scales with container width after orientation changes and wide/standard layout toggles.
9. Hidden-container risks: hidden diagrams can render at zero width or with clipped labels.
10. Duplicate-initialization risks: reused diagram ids can collide in Mermaid internals and produce duplicate SVG or wrong labels.
11. Source-preservation requirements: original Mermaid text remains canonical for authoring, JSON export, Reveal export, print, and diagnostics.
12. Export requirements: export original source plus optional generated artifact metadata; generated SVG must be reproducible from source.
13. Diagnostics/error reporting: include diagram id, source excerpt, parser message, and theme in diagnostics.
14. Test fixtures required: flowchart, sequence diagram, invalid syntax, theme switch, duplicate id collision candidate, hidden-to-visible render.
15. Manual tests required: RND-003 plus mobile width checks for labels and arrows.
16. Mobile risks: long labels and fixed SVG dimensions can overflow iPhone portrait.
17. Implementation phase: Phase 2 after adapter id namespace and visibility gate tests exist.

### JSXGraph

1. Baseline behavior to preserve: create interactive geometry boards at usable size, keep controls responsive, and avoid collapsed boards after navigation or orientation changes.
2. Source data shape: board id, board options, script or construction source, initial bounding box, element dependencies, and owning block metadata.
3. Validation requirements: require stable board id, supported construction source, numeric bounds where provided, and explicit diagnostics for unsafe or malformed scripts.
4. Container requirements: visible element with non-zero width and height, isolated board namespace, and no reused child nodes from a previous board.
5. Initialization timing: initialize only after the section panel is visible and dimensions are non-zero.
6. Rerender behavior: prefer update only for source-preserving option changes; remount when construction source or board id changes.
7. Cleanup behavior: call the JSXGraph board destruction path, remove listeners, clear container children, and release adapter markers.
8. Resize/orientation behavior: call board resize/update after layout toggles and iPhone orientation changes.
9. Hidden-container risks: hidden board containers can initialize at zero size and become permanently collapsed.
10. Duplicate-initialization risks: duplicate board ids can bind controls to the wrong instance or leak event handlers.
11. Source-preservation requirements: keep construction source and normalized options independent from runtime board objects.
12. Export requirements: JSON export keeps source; print/student exports must preserve a reproducible source and may need static fallback captures later.
13. Diagnostics/error reporting: include board id, construction type, container dimensions, and thrown initialization errors.
14. Test fixtures required: simple board, interactive point, invalid script, hidden container, duplicate id, orientation resize.
15. Manual tests required: RND-004 and RND-005 on desktop and real iPhone.
16. Mobile risks: touch dragging, collapsed boards, landscape recovery, and scroll gesture conflicts.
17. Implementation phase: Phase 2 after visible-container lifecycle test harness exists.

### Plotly

1. Baseline behavior to preserve: render 2D and 3D plots at visible size, keep interactions usable, and update charts after navigation and layout changes.
2. Source data shape: data traces, layout, config, plot id, optional generated data source, and owning block metadata.
3. Validation requirements: require trace array or accepted baseline-compatible plot payload, validate layout/config are objects, reject unknown non-object roots with diagnostics.
4. Container requirements: visible container with non-zero dimensions and one Plotly instance per plot id.
5. Initialization timing: call initial render after container visibility and dimensions are known.
6. Rerender behavior: use a stable update path for data/layout/config changes; remount when plot id or renderer mode changes.
7. Cleanup behavior: call Plotly purge or equivalent, remove listeners, and clear adapter-owned state.
8. Resize/orientation behavior: call resize after sidebar, wide layout, mobile orientation, and container visibility changes.
9. Hidden-container risks: hidden plots often render at zero width and need deferred initialization or resize after reveal.
10. Duplicate-initialization risks: multiple Plotly instances on one container leak observers and can mix event handlers.
11. Source-preservation requirements: preserve original traces, layout, config, and generated-data parameters for editing and export.
12. Export requirements: JSON keeps source; print/PDF may need static image generation later; student/Reveal export must rerender from source or include compatible script payload.
13. Diagnostics/error reporting: include plot id, trace count, layout keys, container dimensions, and thrown Plotly errors.
14. Test fixtures required: 2D scatter, 3D surface, invalid trace, hidden-to-visible plot, resize after layout toggle, mobile width plot.
15. Manual tests required: RND-002 and statistics renderer checks where Plotly is used.
16. Mobile risks: large plots can overflow, 3D controls can conflict with scroll, and resize after orientation can lag.
17. Implementation phase: Phase 2 after resize observer policy and dependency strategy are approved.

### Plotly Explore

1. Baseline behavior to preserve: interactive Explore widgets update Plotly charts from controls such as sliders and selectors without losing current control state on rerender.
2. Source data shape: base Plotly payload, parameter definitions, initial parameter values, generated trace expression or table reference, and owning block metadata.
3. Validation requirements: validate Plotly payload plus parameter ids, value ranges, default values, and expression references before initialization.
4. Container requirements: visible plot container plus stable control container with accessible labels and unique ids.
5. Initialization timing: initialize controls and plot together after both containers are attached and visible.
6. Rerender behavior: update plot data when controls change; preserve control state unless source identity changes.
7. Cleanup behavior: remove control listeners, purge Plotly instance, and clear generated state.
8. Resize/orientation behavior: resize Plotly chart and keep controls usable after layout and orientation changes.
9. Hidden-container risks: hidden plot sizing and hidden range inputs can produce incorrect chart dimensions or stale control positions.
10. Duplicate-initialization risks: duplicate control listeners can apply updates more than once or desynchronize displayed values.
11. Source-preservation requirements: keep original parameter definitions and generation source independent from generated traces.
12. Export requirements: JSON export keeps Explore source; student export must include enough source to rebuild controls and chart; print/PDF can capture a selected state later.
13. Diagnostics/error reporting: include widget id, parameter id, generated trace status, and Plotly errors.
14. Test fixtures required: single slider, multiple controls, invalid parameter range, hidden-to-visible Explore widget, state-preserving rerender.
15. Manual tests required: RND-002 with slider/control interaction on desktop and iPhone.
16. Mobile risks: control density, touch slider precision, landscape resize, and chart scroll conflicts.
17. Implementation phase: Phase 2 after base Plotly adapter and Explore state contract are accepted.

### Arquero

1. Baseline behavior to preserve: render table outputs and derived data previews without losing source script or making mobile overflow unusable.
2. Source data shape: Arquero expression or table spec, input data reference, output mode, table id, and owning block metadata.
3. Validation requirements: require source string or accepted structured table spec, validate referenced data exists, cap expensive previews, and report unsafe or malformed expressions.
4. Container requirements: stable table container with horizontal overflow behavior and no mixed ownership with raw source display.
5. Initialization timing: execute or render only after data dependencies are available and container is attached.
6. Rerender behavior: rerun when source, data dependency, or output mode changes; do not rerun for unrelated shell rerenders.
7. Cleanup behavior: remove table DOM and release generated data references owned by the adapter.
8. Resize/orientation behavior: table overflow and sticky headers must remain usable after mobile orientation changes.
9. Hidden-container risks: hidden tables can compute clipped widths or lose scroll affordances.
10. Duplicate-initialization risks: repeated execution can duplicate rows, duplicate diagnostics, or rerun expensive transforms.
11. Source-preservation requirements: preserve raw expression or table spec for authoring, export, and diagnostics.
12. Export requirements: JSON keeps source and data references; print/student exports should include reproducible source or a generated table snapshot with provenance.
13. Diagnostics/error reporting: include table id, source excerpt, row count when available, capped execution reason, and thrown errors.
14. Test fixtures required: simple table, derived table, invalid expression, large sample cap, mobile overflow table.
15. Manual tests required: RND-006 plus export round-trip checks for table source.
16. Mobile risks: wide tables, sticky controls, memory pressure, and expensive transforms on low-power devices.
17. Implementation phase: Phase 2 or Phase 3 after data dependency contract is approved.

### SVG

1. Baseline behavior to preserve: render SVG blocks legibly, preserve scaling, and keep source markup or safe normalized data available.
2. Source data shape: raw SVG markup or structured SVG payload, dimensions/viewBox, alt text, block id, and safety metadata.
3. Validation requirements: require string or structured SVG source, reject unsafe script/event attributes according to accepted policy, and preserve rejected source as diagnostics/fallback.
4. Container requirements: isolated container that prevents event/script leakage and supports responsive scaling.
5. Initialization timing: inject or construct after validation and after container attachment.
6. Rerender behavior: rerender on source, dimensions, theme class, or accessibility metadata changes.
7. Cleanup behavior: remove adapter-owned SVG DOM and listeners.
8. Resize/orientation behavior: confirm viewBox and CSS allow scaling after sidebar and orientation changes.
9. Hidden-container risks: fixed dimensions can overflow when revealed if sizing was computed while hidden.
10. Duplicate-initialization risks: duplicate ids inside SVG can collide with the page or other SVG blocks.
11. Source-preservation requirements: raw or normalized SVG source remains canonical for authoring and export.
12. Export requirements: JSON keeps source; print/PDF and student export may embed sanitized SVG or static fallback according to security policy.
13. Diagnostics/error reporting: include block id, validation failures, unsafe attribute names, and dimensions.
14. Test fixtures required: valid responsive SVG, fixed-size SVG, unsafe attribute fixture, duplicate id fixture, invalid markup.
15. Manual tests required: RND-007 with desktop and iPhone scaling checks.
16. Mobile risks: fixed width overflow, tiny labels, and gesture conflicts if SVG is interactive.
17. Implementation phase: Phase 2 after SVG safety policy is approved.

### Manim/video placeholders

1. Baseline behavior to preserve: show video/media placeholders and controls or load errors without blocking lesson navigation.
2. Source data shape: media url or placeholder id, poster, caption, dimensions, transcript or alt text, and owning block metadata.
3. Validation requirements: require url or placeholder id, validate allowed media type, validate dimensions where present, and report missing media as non-fatal diagnostics.
4. Container requirements: responsive media container with fallback message area and accessible controls.
5. Initialization timing: attach media element or placeholder after container is mounted; defer heavy loading when hidden if supported.
6. Rerender behavior: update metadata and source only when media identity changes; preserve playback state policy explicitly.
7. Cleanup behavior: pause media, release object URLs when used later, remove listeners, and clear adapter state.
8. Resize/orientation behavior: maintain aspect ratio and controls after mobile rotation and wide layout toggles.
9. Hidden-container risks: hidden video can load unnecessarily or compute incorrect poster sizing.
10. Duplicate-initialization risks: duplicate media elements can continue playback or network loading after navigation.
11. Source-preservation requirements: media source metadata and placeholder source must remain available for export and authoring.
12. Export requirements: JSON keeps media metadata; student/Reveal export must preserve links or placeholders; print/PDF needs poster or fallback text.
13. Diagnostics/error reporting: include media id, url, media type, load status, and fallback reason.
14. Test fixtures required: valid video placeholder, missing url, poster-only fallback, invalid media type, responsive aspect ratio.
15. Manual tests required: RND-007 with load error and responsive control checks.
16. Mobile risks: autoplay restrictions, iPhone media controls, safe-area spacing, and network failures.
17. Implementation phase: Phase 3 or Phase 5 depending on export policy.

### Calculator widgets

1. Baseline behavior to preserve: calculator widgets compute expected values, render any formula or chart output, and insert snippets into the intended authoring target later without cross-target leakage.
2. Source data shape: calculator type, input values, output format, optional insertion target metadata, and owning widget id.
3. Validation requirements: validate calculator type, numeric/domain inputs, output format, and target metadata without executing authoring insertion in this phase.
4. Container requirements: stable widget container with accessible controls and separate output renderer hosts.
5. Initialization timing: initialize controls after container mount; initialize nested renderers only through their adapters later.
6. Rerender behavior: recompute only when validated inputs change; preserve user-entered draft values through shell rerenders.
7. Cleanup behavior: remove event listeners, pending calculations, nested renderer instances, and diagnostics.
8. Resize/orientation behavior: keep controls and any nested Plotly/KaTeX output usable after mobile orientation changes.
9. Hidden-container risks: nested renderers can initialize incorrectly if calculator panels are hidden.
10. Duplicate-initialization risks: duplicated listeners can compute twice or insert into the wrong future authoring target.
11. Source-preservation requirements: preserve input values, formula source, output metadata, and insertion target provenance.
12. Export requirements: JSON keeps calculator source and generated output provenance; student/print exports need deterministic output snapshots later.
13. Diagnostics/error reporting: include widget id, calculator type, invalid input details, and nested renderer diagnostics.
14. Test fixtures required: numeric calculator, formula output, invalid input, nested plot output, deferred insertion target metadata.
15. Manual tests required: calculator smoke checks plus export checks once calculator migration begins.
16. Mobile risks: dense controls, numeric keyboard behavior, wide output, and slow calculations.
17. Implementation phase: Phase 3 or Phase 4 after pure calculation services are isolated.

### Statistics widgets

1. Baseline behavior to preserve: statistics widgets compute deterministic summaries, respect heavy sample caps, and render table, formula, and Plotly outputs without freezing the page.
2. Source data shape: dataset source, statistic operation, parameters, output renderer references, sample cap, and owning widget id.
3. Validation requirements: validate dataset shape, operation id, numeric parameters, sample limits, and output renderer references.
4. Container requirements: stable widget container with separate result, table, formula, and chart hosts.
5. Initialization timing: run computation after data source validation; initialize nested renderers only after output hosts are visible.
6. Rerender behavior: recompute when dataset, operation, or parameters change; avoid recompute on unrelated shell rerenders.
7. Cleanup behavior: cancel pending work where possible, clear nested renderer instances, and release generated tables/charts.
8. Resize/orientation behavior: resize nested Plotly charts and keep tables scrollable after layout and orientation changes.
9. Hidden-container risks: nested Plotly/table renderers can size incorrectly when hidden.
10. Duplicate-initialization risks: repeated computation can duplicate rows, charts, or diagnostics and can hurt mobile performance.
11. Source-preservation requirements: preserve dataset source, operation parameters, random seeds if used, and output provenance.
12. Export requirements: JSON keeps source and parameters; print/student export should use deterministic generated outputs with provenance.
13. Diagnostics/error reporting: include widget id, operation id, row count, cap reason, nested renderer diagnostics, and thrown errors.
14. Test fixtures required: small dataset, invalid data, capped large dataset, formula output, Plotly output, table output.
15. Manual tests required: RND-008 with performance and mobile usability notes.
16. Mobile risks: CPU cost, memory pressure, table overflow, and chart resize after orientation.
17. Implementation phase: Phase 3 or Phase 8 after statistics services and nested renderer contracts are ready.

## Phase 2 Acceptance Criteria

1. The generic adapter contract is accepted before implementation.
2. Each adapter implementation PR covers one renderer family unless explicitly approved.
3. Every adapter PR includes validation, mount, cleanup, duplicate-init, hidden-container, resize/orientation, source-preservation, diagnostics, and export-source tests where applicable.
4. MathLive implementation does not start until real iPhone manual checklist hooks are ready.
5. Renderer dependency installation is reviewed per adapter PR or as an explicitly approved pinned bundle.
6. No PR may mutate `legacy/mathlesson-v4.9.22/`.

## Next Step After Approval

Implement one adapter at a time behind tests, starting with the renderer whose dependency, source shape, and lifecycle risk are best understood after this plan is reviewed.
