# Phased Migration Plan

Each phase must remain buildable and testable. Phase 0 does not begin production React implementation.

## Phase 0 - Audit And Architecture Map

Objective: preserve v4.9.22 evidence, inventory dependencies/features/state/events/schemas/renderers/exports/persistence, and propose migration architecture.

Entry criteria: kickoff package available; Git repository initialized/cloned; no production React code started.

Affected subsystems: documentation, baseline preservation, tooling.

Likely files: `legacy/**`, `analysis/**`, `docs/**`, `.agents/skills/**`, `skills-lock.json`, `.gitignore`.

Automated tests: SHA-256 verification; static analysis scripts; skills discovery/frontmatter checks; Phase 0 deliverable verifier.

Manual tests: none claimed as passed; baseline parity checklist recorded at `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md`.

Mobile tests: none executed; identify required iPhone checklist.

Acceptance criteria: all Phase 0 deliverables exist; baseline hashes pass; missing evidence listed; manual checklist exists without pass claims; no production React components.

Rollback strategy: remove Phase 0 docs/tooling branch; baseline source folder outside repo remains unchanged.

Documentation updates: all audit/architecture docs and ADR proposals.

Known risks: static analysis can miss runtime behavior; v4.9.22 ZIP/screenshots/report missing.

Exit criteria: user approves Phase 1 scope.

## Phase 1 - React Shell And Responsive Layout

Objective: create minimal Vite/React/TypeScript shell that mirrors baseline layout/navigation without migrating complex feature internals.

Entry criteria: Phase 0 approved; dependency/package manager policy accepted; baseline manual checklist available.

Affected subsystems: app shell, routing/panels, theme/layout persistence, reduced-motion adapter.

Likely files: `package.json`, `vite.config.ts`, `tsconfig*.json`, `src/app/**`, `src/components/shell/**`, `src/state/**`, `src/styles/**`.

Automated tests: smoke render, navigation store, theme/layout persistence, reduced-motion behavior.

Manual tests: load app, switch panels/lessons stub, mobile sidebar, theme toggle.

Mobile tests: responsive shell at iPhone portrait/landscape widths; no horizontal scroll.

Acceptance criteria: app builds with Vite; shell works with placeholder/static legacy content; no renderer migration claimed.

Rollback strategy: keep legacy app untouched; remove shell branch files if needed.

Documentation updates: package/Node ADR, manual checklist draft.

Known risks: visual drift, over-scaffolding, premature feature migration.

Exit criteria: shell can host a stable renderer container and persistence service.

## Phase 2 - Renderer And Input Adapters

Objective: implement adapter interfaces for KaTeX, MathLive, Mermaid, JSXGraph, Plotly/Explore, Arquero, SVG, video, statistics blocks.

Entry criteria: Phase 1 shell has stable containers and reduced-motion hook.

Affected subsystems: renderers, MathLive keyboard, resize/orientation, cleanup.

Likely files: `src/renderers/**`, `src/hooks/useStableRendererHost.ts`, `src/services/mathLiveKeyboard/**`.

Automated tests: adapter contract tests for init/update/cleanup, hidden-container guards, source preservation.

Manual tests: Framework Demo renderers in baseline order.

Mobile tests: MathLive real keyboard precheck, JSXGraph orientation resize, Plotly visible-container render.

Acceptance criteria: adapters render representative fixtures and clean up on unmount; no app-wide state in GSAP/renderers.

Rollback strategy: feature flag adapters behind legacy host until tests pass.

Documentation updates: renderer adapter ADR and lifecycle docs.

Known risks: MathLive native keyboard, Plotly/JSX hidden containers, Mermaid source mutation.

Exit criteria: renderer fixtures pass and can be used by lesson player.

## Phase 3 - Lesson Player, Quiz, Exercises, Persistence

Objective: migrate learner mode, lesson navigation, quiz engine, inline exercises, notes/progress/score persistence.

Entry criteria: renderer/input adapters available; persistence codecs defined.

Affected subsystems: lesson player, quiz, exercises, answer checking, localStorage.

Likely files: `src/features/lesson-player/**`, `src/features/quiz/**`, `src/features/exercises/**`, `src/services/persistence/**`.

Automated tests: baseline smoke, schema compatibility, quiz state-machine, exercise checking, persistence compatibility, renderer navigation rerender.

Manual tests: built-in lessons, quiz submit/reset/review, inline exercises, notes, mark done.

Mobile tests: full MathLive regression contract on real iPhone remains required.

Acceptance criteria: learner mode matches v4.9.22 manual checklist except author/export features not yet migrated.

Rollback strategy: keep legacy HTML as fallback reference; isolate feature routes.

Documentation updates: testing checklist and known behavior gaps.

Known risks: answer equivalence drift, keyboard stale state, legacy localStorage compatibility.

Exit criteria: learner/quiz/exercise/persistence tests pass with evidence.

## Phase 4 - Author Workspace And Schema Tools

Objective: migrate author editor, CodeMirror adapter, import, workspace, structured workbench, schema diagnostics.

Entry criteria: lesson player and persistence stable; schema fixtures created.

Affected subsystems: authoring, import, schema migration, CodeMirror, workspace, structured blocks.

Likely files: `src/features/authoring/**`, `src/schema/**`, `src/services/files/**`.

Automated tests: import/export round trips, unknown-block preservation, Mermaid source repair, CodeMirror adapter tests.

Manual tests: create/save/import/preview lessons, edit Mermaid/JSX/Plotly blocks.

Mobile tests: author modal usability at mobile widths, but no redesign beyond parity.

Acceptance criteria: authoring workflows preserve v4.9.22 data and imported lessons boot correctly.

Rollback strategy: keep authoring behind route/feature flag until complete.

Documentation updates: schema docs, authoring guide migration notes.

Known risks: source-range corruption, CodeMirror lifecycle, schema field loss.

Exit criteria: authoring and schema round-trip tests pass.

## Phase 5 - Print, Presentation, And Student Exports

Objective: migrate JSON, student standalone, Reveal, and print/PDF export pipelines with golden tests.

Entry criteria: player/authoring models stable; renderer adapters expose export support.

Affected subsystems: import-export, presentation, printing, generated HTML runtimes.

Likely files: `src/features/import-export/**`, `src/features/presentation/**`, `src/features/printing/**`, `tests/golden/**`.

Automated tests: generated JSON/student/Reveal goldens with normalized timestamps, Playwright open generated files, print-layout smoke.

Manual tests: open exported student/Reveal files, print preview/PDF, real iPhone student export MathLive.

Mobile tests: student export portrait/landscape, keyboard safe-area, orientation changes.

Acceptance criteria: exported artifacts preserve baseline workflows and dependency inclusion policy.

Rollback strategy: keep legacy export builders available until new goldens pass.

Documentation updates: export pipeline docs and manual checklist.

Known risks: generated runtime divergence, CDN pinning, iOS file handling, print pagination.

Exit criteria: all export tests pass and manual gaps documented.

## Phase 6 - GSAP And Educational Animation

Objective: reintroduce/modernize animation through a reduced-motion-safe adapter after behavioral parity.

Entry criteria: Phase 5 parity accepted; reduced-motion tests exist.

Affected subsystems: animation, panel transitions, quiz score animation, educational animation hooks.

Likely files: `src/animation/**`, renderer animation integration where needed.

Automated tests: reduced-motion, no state in GSAP, cleanup on unmount.

Manual tests: panel animation and score animation match acceptable baseline feel.

Mobile tests: no keyboard/layout jank.

Acceptance criteria: animation does not affect app state or accessibility.

Rollback strategy: disable motion adapter.

Documentation updates: animation policy.

Known risks: jank and over-animation.

Exit criteria: motion accepted with reduced-motion evidence.

## Phase 7 - Independent MathWeaver Feature Analysis

Objective: inspect MathWeaver only after MathLesson parity and produce independent feature comparison.

Entry criteria: Phase 5 parity accepted; user authorizes MathWeaver inspection.

Affected subsystems: planning only.

Likely files: `docs/audit/mathweaver-feature-comparison.md`.

Automated tests: none unless features later approved.

Manual tests: N/A.

Mobile tests: N/A.

Acceptance criteria: ideas classified independently reimplement, adapt conceptually, reject, or defer.

Rollback strategy: discard comparison doc; no code dependency.

Documentation updates: comparison and ADRs if needed.

Known risks: provenance contamination; avoid code copying.

Exit criteria: user approves or rejects proposed ideas.

## Phase 8 - Statistical Expansion

Objective: expand statistics after parity with deterministic numerical tests.

Entry criteria: statistics baseline tests pass; user approves expansion scope.

Affected subsystems: statistics engine, calculator, docs, examples.

Likely files: `src/features/statistics/**`, docs under `docs/statistics`.

Automated tests: seeded randomness, tolerance-based numerical tests, property-based tests where justified.

Manual tests: statistics UI and inserted blocks.

Mobile tests: plot and table usability.

Acceptance criteria: no regression to baseline statistics; new features documented and tested.

Rollback strategy: feature flags or revert stats expansion modules.

Documentation updates: API and guide docs.

Known risks: numerical drift, dependency weight.

Exit criteria: expansion tests and docs pass.
