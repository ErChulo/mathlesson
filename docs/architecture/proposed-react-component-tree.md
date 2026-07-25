# Proposed React Component Tree

Objective: preserve v4.9.22 behavior while moving lifecycle-heavy work behind adapters and keeping algorithms outside components.

This is not a visual redesign. Components are proposed only where they own UI composition or user interaction. Pure parsing, grading, persistence, export, and renderer lifecycle work should be functions or services.

## Tree Overview

```text
<AppRoot>
  <AppProviders>
    <ResponsiveAppShell>
      <SidebarNav />
      <TopBar />
      <MainPanelHost>
        <TableOfContentsPanel />
        <LessonSectionPanel />
        <QuizPanel />
        <CalculatorPanel />
        <StatisticsPanel />
        <AuthorWorkspacePanel />
        <StructuredWorkbenchPanel />
        <LessonPlannerPanel />
        <RevealExportPlannerPanel />
        <PrintPlannerPanel />
        <AuthorGuidePanel />
      </MainPanelHost>
      <EditorModal />
      <ExportDiagnosticsPanel />
      <MobileOrientationHint />
      <ToastStack />
    </ResponsiveAppShell>
  </AppProviders>
</AppRoot>
```

## Components And Boundaries

| Component/module | Responsibility | Inputs | Outputs | Owned state | External effects | Test boundary | Renderer/service dependencies | Why component rather than function/service |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AppRoot` | Compose providers and shell | Initial app config, built-in lessons | Rendered app | None beyond provider state | Starts no renderer directly | Smoke render | `appBootstrap` | It owns the application render tree |
| `AppProviders` | Provide theme, layout, active lesson, persistence adapters | Service instances | Context values | Provider-level stores | localStorage reads during initialization | Provider unit tests | `persistenceService`, `themeStore`, `lessonRepository` | Cross-cutting UI state needs shared access |
| `ResponsiveAppShell` | Preserve sidebar/topbar/content layout and mobile hamburger behavior | Layout state, active panel | Navigation events | Mobile sidebar open/closed | Body scroll lock on mobile sidebar | RTL/mobile shell tests | `layoutStore`, `mediaQueryService` | Layout is UI composition, not domain logic |
| `SidebarNav` | Render lesson selector, section nav, advanced nav | Lesson list, sections, active panel, progress | `selectLesson`, `goPanel`, layout toggles | Expanded advanced group only if not store-owned | None except event callbacks | Navigation interaction tests | `navigationStore` | Dynamic nav is UI; persistence stays service |
| `TopBar` | Breadcrumb, workflow pill, theme/layout/print buttons | Active panel metadata, theme/layout state | Toggle events, print command | None | None directly | Snapshot and interaction tests | `themeStore`, `printService` | UI controls and labels |
| `MainPanelHost` | Route active panel to correct panel component | Active panel id, lesson | Panel render | None | Scroll to top on panel change | Panel routing tests | `navigationService` | Coordinates mutually exclusive panels |
| `LessonSectionPanel` | Render a lesson section's HTML and attach runtime renderers | Section content, section id, theme | Done/notes events | Minimal local mount token | Calls renderer adapter pipeline after DOM mount | Renderer lifecycle integration tests | `renderPipeline`, `notesService`, `progressService` | Needs a stable DOM container for renderer adapters |
| `RendererHost` | Generic wrapper for DOM-backed renderer content | HTML/source and renderer list | Render status/errors | Adapter statuses | Mount/update/unmount renderers | Adapter contract tests | Renderer adapters | Component only because it provides stable container refs |
| `QuizPanel` | Render quiz UI and state transitions | Quiz model, saved answers | Submit/reset/review events | Quiz interaction state; durable answers delegated | MathLive configuration through adapter host | Quiz state-machine tests | `quizEngine`, `mathLiveKeyboardService`, `quizPersistence` | Complex UI flow; grading stays service |
| `QuizQuestionCard` | Render one question type and feedback | Question, answer state, graded state | Answer change | Local focus/UI details only | MathLive field ref registration | Per-type question tests | `answerInputAdapter` | Repeated UI structure with controlled outputs |
| `InlineExercise` | Render/check one inline exercise from validated source | Exercise spec or DOM dataset snapshot | Check result | Attempts and disabled/readOnly | MathLive hide on Check | Exercise checking tests | `exerciseEngine`, `mathLiveKeyboardService` | It owns interactive widget UI; grading is pure service |
| `CalculatorPanel` | Calculator UI and insert controls | Current editor target | Run/insert events | Current input/result | May save editor target via service | Calculator engine tests plus panel e2e | `calculatorEngine`, `lessonEditorService` | UI panel with form controls |
| `StatisticsPanel` | Statistics/probability UI and insert controls | Current editor target | Run/insert events | Current input/result | Plotly stat adapter for preview | Deterministic stats tests | `statisticsEngine`, `plotlyAdapter` | UI form and result panel |
| `AuthorWorkspacePanel` | Edit whole section or detected block with preview | Active/exported lesson | Save/preview/apply events | Workspace draft selection | Saves draft through repository | Workspace round-trip tests | `workspaceParser`, `renderPipeline` | Interactive authoring surface |
| `StructuredWorkbenchPanel` | Edit structured block records without making them canonical yet | Normalized lesson | Save structured draft | Structured selection | Saves draft through repository | Structured parse/build tests | `structuredBlockService` | UI for records; parsing/building stays service |
| `LessonPlannerPanel` | Show teaching-flow risk/actions | Export payload | Navigation/action events | None | None | Planner pure-service tests | `lessonPlannerService` | Presents computed plan |
| `RevealExportPlannerPanel` | Show slide split plan and adapter inventory | Export payload | Export/scan events | None | None | Planner golden tests | `revealPlannerService`, `toolAdapterRegistry` | Presents computed plan |
| `PrintPlannerPanel` | Show print/PDF risk/actions and print controls | Export payload | Print/scan/preset events | Current print preset | Injects print style only through service | Print planner tests | `printPlannerService` | UI controls for print planning |
| `EditorModal` | Modal shell, CodeMirror-backed fields, editor tabs | Draft lesson | Save/load/export/import events | Editor draft indices and tab state | CodeMirror adapter, drag/resize service | Authoring e2e | `codeEditorAdapter`, `lessonRepository`, `importExportService` | Stateful authoring UI |
| `ExportDiagnosticsPanel` | Show preflight warnings | Diagnostics array/title | Close event | Open/closed | None | Simple UI tests | `diagnosticsService` | UI display component |
| `MobileOrientationHint` | Preserve v4.9.22 math-answer-only orientation guidance | MathLive focus service state | Dismiss event | Dismissed/read transient | localStorage dismissed key | Mobile behavior tests | `mathLiveKeyboardService` | Visual hint tied to focus state |
| `ToastStack` | Show notices | Notice store | None | Notices list | Timers for removal | Timer tests | `noticeService` | UI notification list |

## Non-Component Deep Modules

| Module | Responsibility | Reason not component |
| --- | --- | --- |
| `lessonRepository` | Built-in/user lesson lookup, legacy localStorage codecs | Pure persistence/domain API, no UI |
| `schemaMigrations` | Normalize imports, preserve unknown blocks, diagnostics | Deterministic data transform |
| `quizEngine` | Grade MC/TF/math/free and model transitions | Pure logic and easy fixture testing |
| `exerciseEngine` | Inline exercise answer equivalence and regex variants | Pure logic |
| `renderPipeline` | Ordered renderer initialization and cleanup | Lifecycle service called by host refs |
| `mathLiveKeyboardService` | Native keyboard policy, outside tap, safe area, suppression | Global DOM lifecycle not JSX logic |
| `plotlyAdapter`, `jsxgraphAdapter`, `mermaidAdapter`, `katexAdapter`, `arqueroAdapter`, `statisticsRenderer`, `videoAdapter`, `svgAdapter` | Renderer-specific lifecycle | Prevent renderer APIs in React components |
| `exportServices` | JSON/student/Reveal/print payload and HTML generation | Mostly pure string/data builders, test with goldens |
| `statisticsEngine`, `calculatorEngine`, `mathEquivalence` | Numerical/symbolic algorithms | Unit-testable without React |

## Component Design Constraints

1. A component may own layout and events, but not renderer-specific initialization details.
2. A component may call an adapter through a narrow interface with a stable container ref.
3. Business algorithms must be imported from services and tested separately.
4. Legacy HTML rendering should be isolated to a small number of `RendererHost`/section components during parity.
5. No giant component should combine authoring, quiz, renderer lifecycle, and export logic.
