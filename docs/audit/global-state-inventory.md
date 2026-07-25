# Global-State Inventory

Principle: do not mechanically convert every global to React state. State should move to the smallest owner that can preserve behavior, testability, and renderer lifecycle correctness.

| Global or family | Classification | Evidence | Ownership in baseline | Proposed destination | Notes and risks | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `MATHLESSON_APP_VERSION`, `MATHLESSON_LESSON_SCHEMA_VERSION`, `MATHLESSON_SCHEMA_REGISTRY_VERSION`, `MATHLESSON_BLOCK_SCHEMA_VERSION` | Constant/version metadata | `_inline.v4.9.22.mjs:7-11` | Module global | `src/schema/versions.ts` | Must remain exported into JSON/student/reveal payloads | High |
| `STRUCTURED_BLOCK_SCHEMA_REGISTRY` | Configuration/schema registry | `_inline.v4.9.22.mjs:12-38` | Module global | `src/schema/blockRegistry.ts` | Unknown block policy is compatibility-critical | High |
| `TOOL_ADAPTERS`, `TOOL_ADAPTER_REGISTRY_VERSION` | Configuration/adapter registry | `_inline.v4.9.22.mjs:339-350` | Module global | `src/renderers/registry.ts` | Future adapters should implement lifecycle interface, not just selector lists | High |
| `LESSONS` | Constant built-in lesson data | `_inline.v4.9.22.mjs:353+` | Module global | `src/fixtures/builtInLessons.ts` or `legacyBaselineLessons.ts` during parity | Large object may be split after tests; preserve schema first | High |
| `LS` wrapper and `lsKey` | Persistence compatibility shim | `_inline.v4.9.22.mjs:592-605` | Module global service | `src/services/persistence/localStorageStore.ts` | JSON parse failure returns `null`; preserve this behavior | High |
| `lesson`, `activeLessonKey`, `quizRendered`, `mcSel`, `tfSel`, `visitedSections`, `doneSections` | Mutable application state | `_inline.v4.9.22.mjs:637-642` | Shared app globals | `src/state/appSessionStore.ts` plus quiz state machine | Only durable pieces go to localStorage; transient rendering flags should not be React app-wide state | High |
| `ce` | Renderer/service state | `_inline.v4.9.22.mjs:637` | Module global Compute Engine instance | `src/services/math/computeEngine.ts` | Inject into pure answer-checking functions for tests | High |
| `THEME_KEY`, `THEME_PALETTES`, `activeTheme`, `PLOT_LAYOUT` | Configuration plus mutable UI/render state | `_inline.v4.9.22.mjs:670-809` | Module global and DOM dataset | `src/state/themeStore.ts`; `src/renderers/plotlyTheme.ts` | Plotly/Mermaid/JSX sync should be effects outside React render | High |
| `window.__mlMermaidConsoleGuardInstalled`, `window.__mlMermaidSuppressedWarnings`, `window._mermaidInited`, `window._mermaidRenderSeq` | Compatibility shim/renderer state/diagnostic state | `_inline.v4.9.22.mjs:42-72`, `7289-7315` | Window globals | `renderers/mermaid/session.ts` | Console patching should be minimized and documented if retained | High |
| `window.__mlMathLiveKeyboardSuppressUntil`, `window.__mlActiveMathLiveField` | Renderer/UI transient state | `_inline.v4.9.22.mjs:100-119`, `206-226`, `293-319` | Window globals | `services/mathLiveKeyboard/session.ts` | Must not become durable state; must clear on navigation/unmount | High |
| `window.__mlMobileOrientationHintInstalled` | Compatibility shim | `_inline.v4.9.22.mjs:135-186` | Window global singleton guard | MathLive/mobile UX service singleton | Prevent duplicate global listeners; React cleanup should replace singleton where possible | High |
| `ML_CM` | Renderer/editor state/cache | `_inline.v4.9.22.mjs:2405-2475` | Module `Map` of CodeMirror instances | `features/authoring/codeMirrorAdapter.ts` | Needs explicit mount/destroy/refresh | High |
| `edLesson`, `edSecIdx`, `edQIdx`, `edCurrentKey`, `edPreviewTimer`, `edCodeSelection`, `edDirty` | Mutable authoring state | `_inline.v4.9.22.mjs:2308-2315` | Module globals | `features/authoring/editorStore.ts` | Draft content can be React state; persistence stays service | High |
| `EDITOR_WINDOW_KEY`, `editorWindowObserver`, `editorWindowResizeTimer` | Mutable UI state/DOM observer | `_inline.v4.9.22.mjs:1857-2030` | Module globals and localStorage | `features/authoring/editorWindow.ts` | Window drag/resize should be isolated from lesson model | High |
| `statInitialized`, `statLastResult` | Mutable feature state/cache | `_inline.v4.9.22.mjs:2146-2233` | Module globals | `features/statistics/statisticsStore.ts` and pure `statisticsEngine.ts` | Keep numerical algorithms pure and seeded | High |
| `calcInitialized`, `calcLastResult`, `CALC_EDITOR_TARGET_KEY` | Mutable feature state plus persistence key | `_inline.v4.9.22.mjs:2235-2306` | Module globals/localStorage | `features/calculator/calculatorStore.ts`; insertion service | Calculator insertion depends on editor target compatibility | High |
| `JSXGRAPH_BOARDS`, `activeJSXBoards`, `jsxResizeTimer`, `jsxResizeObserver`, `window.__mlJSXResizeReady` | Renderer state/cache/DOM observer | `_inline.v4.9.22.mjs:7396-7562` | Module globals/window | `renderers/jsxgraph/adapter.ts` | Must own cleanup and hidden-container guards | High |
| `wsLesson`, `wsKey`, `wsSecIdx`, `wsMode`, `wsBlockSelection` | Mutable author workspace state | `_inline.v4.9.22.mjs:3398-3403` | Module globals | `features/authoring/workspaceStore.ts` | Mermaid source editing must preserve exact source ranges | High |
| `sbLesson`, `sbKey`, `sbSecIdx`, `sbBlockIdx`, `sbSectionBlocks` | Mutable structured-workbench state | `_inline.v4.9.22.mjs:3766-3779` | Module globals | `features/authoring/structuredBlocksStore.ts` | Structured records are not yet canonical replacement schema | High |
| `LAYOUT_KEY`, `DEFAULT_LAYOUT` | Persistence key and configuration | `_inline.v4.9.22.mjs:7651-7658` | Module globals | `src/state/layoutStore.ts` | Affects renderer resize; keep service boundary | High |
| `demoAudioCtx`, `demoSource`, `demoStartTime`, `demoAnimFrame` | Renderer/media state | `_inline.v4.9.22.mjs:1188-1292` | Module globals | `features/media/demoMediaController.ts` | Needs audio/canvas cleanup on unmount/navigation | Medium |
| Student export globals: `ML_STUDENT_PAYLOAD`, `STUDENT_STORE_PREFIX`, `studentVisited`, `studentDone`, `studentActivePanel`, `quizRendered`, `ML_STUDENT_ACTIVE_JSX` | Export-only state | `_inline.v4.9.22.mjs:4714-5085`, `5454-5619` | Generated standalone runtime | `features/import-export/studentRuntimeTemplate.ts` | Keep independent but generated from shared algorithms where parity tests allow | High |
| Direct DOM references from `document.getElementById` calls | DOM reference/control state | Throughout, especially `2477-2560`, `7688-7863` | Unstructured DOM | React refs/components or service-owned containers | Do not store raw DOM in app state; renderer adapters receive stable containers | High |
| Persistence keys embedded as strings | Persistence keys | `592-634`, `1008`, `1858`, `2264`, `2317-2348`, `7651-7668`, `7660-7675` | Scattered constants | `services/persistence/keys.ts` | Preserve exact legacy key names until migration tests pass | High |

## Proposed Ownership Rules

| Category | Rule |
| --- | --- |
| Durable learner state | Versioned localStorage service with compatibility codecs |
| Current route/panel | React shell state plus URL/hash only where baseline uses it, especially student export |
| Renderer instances | Adapter-owned, not React global state |
| Answer-checking algorithms | Pure service functions with injected dependencies |
| Authoring drafts | Feature store, persisted only through explicit save/import paths |
| Export payload builders | Pure services where possible; DOM-dependent HTML extraction isolated |
| Window/global event listeners | Single owning hook/service with cleanup and regression tests |
