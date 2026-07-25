# Proposed Module Architecture

Guiding principle: deep modules with small interfaces. Keep compatibility and renderer lifecycles localized.

## Recommended Structure

```text
src/
  app/
    AppRoot.tsx
    AppProviders.tsx
    bootstrap.ts
  components/
    shell/
    common/
    diagnostics/
  features/
    lesson-player/
    quiz/
    exercises/
    authoring/
    statistics/
    calculator/
    import-export/
    presentation/
    printing/
  renderers/
    katex/
    mathlive/
    mermaid/
    jsxgraph/
    plotly/
    arquero/
    svg/
    media/
    statistics/
  schema/
    versions.ts
    lessonSchema.ts
    blockRegistry.ts
    migrations.ts
    diagnostics.ts
  state/
    appSessionStore.ts
    navigationStore.ts
    themeStore.ts
    layoutStore.ts
  hooks/
    useStableRendererHost.ts
    useGlobalEvent.ts
    useReducedMotion.ts
  services/
    persistence/
    files/
    math/
    html/
    diagnostics/
  animation/
    motionAdapter.ts
  styles/
    legacy-parity.css
    print.css
    mobile.css
  tests/
    fixtures/
    golden/
```

## Boundary Decisions

| Boundary | Proposed owner | Evidence/rationale | Tests |
| --- | --- | --- | --- |
| Lesson persistence | `services/persistence` and `features/lesson-player/lessonRepository` | Legacy keys are scattered across `_inline.v4.9.22.mjs:592-634`, `2317-2348`, `4719-4746` | localStorage snapshot compatibility tests |
| Schema normalization | `schema/migrations.ts` | Import and schema migration are explicit at `2882-3082`, `4036-4064` | malformed/unknown-block fixture tests |
| Quiz and exercises | `features/quiz/quizEngine.ts`, `features/exercises/exerciseEngine.ts` | Answer checking lines `1295-1311`, `1469-1529`, `1689-1840` mix DOM and logic | pure unit tests plus e2e |
| MathLive keyboard | `renderers/mathlive` plus `services/mathLiveKeyboard` | v4.9.22 hotfix behavior concentrated at `193-319` and student `4750-4770` | iPhone manual, Playwright pointer/outside tests |
| Renderer lifecycle | `renderers/*` | `goPanel` and student runtime call many renderer init functions in fixed order | adapter contract tests |
| Authoring | `features/authoring` | Editor, workspace, structured workbench are distinct but share lesson repository | authoring e2e and round-trip tests |
| Export builders | `features/import-export`, `features/presentation`, `features/printing` | Export services are string/data builders at `3100-3132`, `4233-4447`, `4617-4712` | golden generated files with normalized timestamps |
| Animation | `animation/motionAdapter.ts` | GSAP calls currently direct at `1096-1100`, `1814-1821` with no reduced-motion gate | reduced-motion tests |
| Documentation generation | `docs` plus TypeDoc config | Needed for future TS source docs | docs build test |

## Package Strategy

Use npm initially because the environment already has npm and no package manager policy exists. Production dependencies must be pinned exact versions during scaffolding. Do not preserve unbounded `latest` dependencies.

## Static Deployment

Vite build output should remain static and Netlify-compatible. No backend is proposed. File import/export, localStorage, and generated standalone HTML remain client-side.

## Legacy Material Policy

`legacy/mathlesson-v4.9.22/` is immutable evidence. `analysis/` contains derived analysis output and extracted source. Production code must not import from `analysis/` or mutate `legacy/`.

## Testing Placement

| Test group | Location |
| --- | --- |
| Pure schema/quiz/statistics/calculator tests | `src/tests/unit` or colocated `*.test.ts` |
| Import/export golden fixtures | `src/tests/golden` |
| Renderer lifecycle tests | `src/tests/renderers` |
| Playwright e2e | `tests/e2e` |
| Manual checklists | `docs/testing/manual-checklists/` |

## Open Architecture Risks

1. Whether to keep built-in lesson content as TS fixtures or external JSON/HTML fragments during parity.
2. How much generated student/Reveal runtime can share with app services while still producing standalone static files.
3. Whether CodeMirror 5 should be retained for parity first or isolated behind an adapter that allows a later editor replacement.
4. How to make MathLive real-device testing part of release gates without blocking local development.
