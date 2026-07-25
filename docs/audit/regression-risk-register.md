# Regression-Risk Register

| ID | Subsystem | Failure mode | Likelihood | Impact | Detection | Prevention | Phase |
| -- | --------- | ------------ | ---------- | ------ | --------- | ---------- | ----- |
| R-001 | MathLive mobile keyboard | Keyboard opens on initial page load | Medium | Critical | iPhone manual test and Playwright focus/load assertions | Keep manual policy and hide after `customElements.whenDefined`; test no initial keyboard state | 2-3 |
| R-002 | MathLive outside-tap | Outside tap fails to dismiss or inside-keyboard tap dismisses | High | Critical | Real iPhone portrait/landscape checklist | Preserve composedPath selector logic from `_inline.v4.9.22.mjs:275-307` in a service | 2-3 |
| R-003 | MathLive safe area | Keyboard bottom row hidden on iPhone | High | Critical | Real iPhone test, visual screenshot | Preserve geometrychange CSS var and safe-area CSS; do not custom keyboard | 2 |
| R-004 | MathLive after Check/submit | Keyboard reopens or remains stale after exercise Check/quiz submit | High | Critical | Manual and e2e checks | Preserve suppression window and dismiss selectors | 3 |
| R-005 | Mermaid source | Rendered SVG persists into lesson JSON instead of Mermaid source | High | High | Golden round-trip test with Mermaid blocks | Store canonical source separately; keep sanitizer/diagnostics | 4-5 |
| R-006 | JSXGraph hidden init | Board initializes in hidden/zero-size container and collapses | High | High | Mobile/desktop navigation tests with hidden panels | Adapter waits for visible finite rect and resizes | 2 |
| R-007 | Plotly zero-width init | Plots render blank after navigation/import | High | High | E2E navigation and mobile viewport tests | Visibility/size guard before Plotly render; purge before rerender | 2 |
| R-008 | Lesson import navigation | Imported lesson does not boot or select correct first/current panel | Medium | High | Import fixture e2e | Preserve `editorShowImportedLesson` boot sequence and dropdown refresh | 4 |
| R-009 | Schema round trip | Unknown properties or unknown blocks are dropped | High | Critical | Golden import/export unknown-block fixtures | Preserve raw section HTML and `html-fallback` records | 3-4 |
| R-010 | Quiz state machine | Reset/retake/review leaves stale graded classes or score | Medium | High | Quiz state-machine tests | Model quiz states explicitly and clear persistence on reset | 3 |
| R-011 | Exercise checking | Regex/alt/symbolic matching differs | Medium | Critical | Unit tests for `mlExerciseAnswerEquivalent`, regex variants | Extract pure answer-checking with fixtures | 3 |
| R-012 | Local persistence | Legacy saved lessons/scores no longer load | Medium | Critical | Persistence compatibility fixtures with localStorage snapshots | Keep legacy key codecs and migrations | 3 |
| R-013 | Student export | Generated student file lacks MathLive/renderer parity | High | Critical | Playwright opens generated export; manual iPhone test | Share tested runtime services or template from adapter outputs | 5 |
| R-014 | Reveal export | Slides overflow or renderers fail after slide change | Medium | High | Generated deck e2e with slide changes | Preserve render-on-ready/slidechanged and sizing logic | 5 |
| R-015 | Print pagination | Visuals/tables cut off or author UI printed | Medium | High | Print CSS snapshot/manual PDF | Keep planner diagnostics and print preparation renderer pass | 5 |
| R-016 | Renderer cleanup | Plotly canvases or JSXGraph boards leak across lessons | Medium | High | Navigation memory/DOM tests | Adapter cleanup on unmount and lesson switch | 2 |
| R-017 | Mobile orientation | Orientation change leaves stale board/keyboard/sidebar state | High | High | Mobile viewport and real device rotation | Centralize orientation handling and schedule renderer resize | 1-2 |
| R-018 | Reduced motion | GSAP causes accessibility issue | High | Medium | CSS/media query and Playwright `prefers-reduced-motion` test | Motion adapter gates GSAP and uses no-op/reduced variant | 1-6 |
| R-019 | CDN pinning | Unpinned `latest` changes behavior | High | High | Dependency inventory and lockfile review | Pin production dependencies in package manager | 1-2 |
| R-020 | CodeMirror lifecycle | Editor duplicated or loses text when tabs switch | Medium | Medium | Editor e2e and unit adapter tests | Adapter owns init/refresh/dispose and syncs textarea | 4 |
| R-021 | Calculator insertion | Calculator inserts into wrong saved section | Medium | Medium | Authoring e2e with saved target | Preserve `ml_calc_editor_target_v1` behavior until redesigned | 4 |
| R-022 | Statistics determinism | Seeded simulations produce changed values | Medium | Medium | Unit tests with explicit seeds/tolerances | Keep algorithms outside React and pin engines | 3 or 8 |
| R-023 | Workspace block editing | Mermaid/source block ranges corrupt section HTML | High | High | Workspace edit golden tests | Maintain source-range tests and fallback wrapper replacement | 4 |
| R-024 | Generated docs | API docs drift or fail to build | Medium | Medium | `docs:api` and `docs:build` CI | Pin TypeDoc and markdown plugin, generated-file policy | 1+ |

## Highest Priority Real-Device Tests

1. MathLive iPhone portrait keyboard open/dismiss/check/submit/outside-tap behavior.
2. MathLive iPhone landscape behavior, bottom-row visibility, and safe-area padding.
3. JSXGraph under Framework Demo section 5 after mobile orientation changes.
4. Student export on iPhone with MathLive quiz and inline exercise.
