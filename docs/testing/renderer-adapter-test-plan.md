# Renderer Adapter Test Plan

Status: planning-only. No production adapter tests are added by this branch.

This branch does not implement renderer adapters. It defines the contract, fixtures, test strategy, and acceptance criteria required before implementation.

## Non-Scope

No runtime renderer implementation, MathLive migration, dependency installation, runtime renderer components, schema changes, or preserved baseline mutation are included.

## Test Layers

| Layer | Purpose | Example assertion |
| --- | --- | --- |
| Pure validation tests | Verify source parsing and diagnostics without DOM or third-party libraries | Invalid Mermaid source remains available as fallback source |
| DOM lifecycle tests | Verify mount, update, resize, duplicate-init, and cleanup against controlled containers | JSXGraph-like adapter refuses zero-size mount or waits for visibility |
| Source preservation tests | Verify export uses canonical source instead of generated DOM | Mermaid export returns original diagram source after rerender |
| Integration host tests | Verify the future React host calls adapters in the right order | Host unmount calls adapter cleanup exactly once |
| Manual parity tests | Capture device and browser behavior that jsdom cannot prove | MathLive keyboard behavior on real iPhone Safari |

## Required Automated Matrix By Renderer

| Renderer | Validation | Mount visible | Hidden visible repair | Update/rerender | Cleanup | Resize/orientation | Duplicate init | Source export | Diagnostics |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KaTeX | Required | Required | Required for display width | Required | Required | Mobile overflow check | Required | Required | Required |
| MathLive | Required | Required | Required | Required for value changes | Required | Real-device hook plus DOM policy | Required | Required | Required |
| Mermaid | Required | Required | Required | Required for theme/source | Required | Required | Required | Required | Required |
| JSXGraph | Required | Required | Required | Required for options/source | Required | Required | Required | Required | Required |
| Plotly | Required | Required | Required | Required for data/layout | Required | Required | Required | Required | Required |
| Plotly Explore | Required | Required | Required | Required for controls | Required | Required | Required | Required | Required |
| Arquero | Required | Required | Required for overflow | Required for data/source | Required | Mobile overflow check | Required | Required | Required |
| SVG | Required | Required | Required for fixed-size SVG | Required | Required | Required | Required for ids | Required | Required |
| Manim/video placeholders | Required | Required | Optional defer policy | Required for media identity | Required | Required | Required | Required | Required |
| Calculator widgets | Required | Required | Required for nested renderers | Required for inputs | Required | Required | Required | Required | Required |
| Statistics widgets | Required | Required | Required for nested renderers | Required for data/params | Required | Required | Required | Required | Required |

## Manual Test Hooks

| Checklist id | Renderer coverage | Required before parity claim |
| --- | --- | --- |
| RND-001 | KaTeX | Yes |
| RND-002 | Plotly and Plotly Explore | Yes |
| RND-003 | Mermaid | Yes |
| RND-004 | JSXGraph desktop and iPhone | Yes |
| RND-005 | JSXGraph iPhone orientation | Yes |
| RND-006 | Arquero | Yes |
| RND-007 | SVG and Manim/video placeholders | Yes |
| RND-008 | Statistics widgets and nested Plotly | Yes |
| ML-001 through ML-009 | MathLive keyboard and math-field lifecycle | Yes, real iPhone Safari required |
| MOB-001 through MOB-004 | Mobile shell, orientation, and MathLive hint behavior | Yes for mobile-sensitive adapters |
| EXP-001 through EXP-008 | Export and print source preservation | Yes before export parity claims |

## Fixture Categories

1. Minimal valid source for each renderer.
2. Complex valid source with nested or interactive behavior.
3. Invalid source that must produce diagnostics and remain exportable.
4. Hidden container that becomes visible after navigation.
5. Duplicate block id or duplicate adapter mount attempt.
6. Resize after sidebar mode, wide layout, and mobile orientation changes.
7. Source with export-sensitive metadata.
8. Mobile overflow or touch-risk source.
9. Nested renderer source for calculator and statistics widgets.
10. Cleanup and remount source used to detect leaked listeners and instances.

## Acceptance Criteria For First Implementation PR

1. Implements only one adapter family unless reviewers approve a dependency-coupled pair.
2. Adds exact-pinned dependencies only if the adapter requires them and the PR body explains the choice.
3. Includes validation, mount, update or explicit no-update policy, resize or explicit no-resize policy, export-source policy, diagnostics, and unmount tests.
4. Includes hidden-container and duplicate-initialization tests.
5. Updates manual checklist status only with actual device evidence; otherwise leaves items as not run.
6. Does not mutate `legacy/mathlesson-v4.9.22/`.
7. Does not claim MathLive parity without real iPhone Safari evidence.

## Non-Automated Risks

jsdom cannot prove MathLive native keyboard behavior, Plotly WebGL behavior, real iPhone safe-area layout, mobile touch gestures, print/PDF fidelity, or generated standalone student/Reveal behavior. Those require manual or browser-based evidence in later implementation PRs.
