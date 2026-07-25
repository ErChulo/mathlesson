# Renderer Fixture Inventory

Status: planning-only inventory. No fixture data files are added by this branch.

This branch does not implement renderer adapters. It defines the contract, fixtures, test strategy, and acceptance criteria required before implementation.

## Non-Scope

No renderer adapter implementation, MathLive migration, dependency installation, runtime renderer components, schema changes, or preserved baseline mutation are included.

## Fixture Naming Policy

Future fixture files should use stable names that include renderer id, behavior, and expected risk, for example `katex-invalid-command`, `plotly-hidden-container`, or `mathlive-iphone-outside-tap`. This document lists required fixture categories only.

## Required Fixture Inventory

| Renderer | Fixture | Purpose | Expected assertion |
| --- | --- | --- | --- |
| KaTeX | `katex-inline-valid` | Inline formula source | Renders without mutating source |
| KaTeX | `katex-display-valid` | Display formula source | Respects display mode and mobile width |
| KaTeX | `katex-invalid-command` | Invalid TeX | Produces diagnostics and preserves source |
| KaTeX | `katex-near-code-and-mermaid` | Source boundary risk | Does not render inside code or Mermaid source |
| MathLive | `mathlive-unfocused-field` | No autofocus policy | Keyboard does not open on load |
| MathLive | `mathlive-focused-field` | Explicit focus policy | Keyboard opens only after interaction |
| MathLive | `mathlive-outside-tap` | Dismissal policy | Outside tap blurs field and closes keyboard |
| MathLive | `mathlive-navigation-remount` | Cleanup policy | Navigation does not reopen stale field |
| Mermaid | `mermaid-flowchart-valid` | Basic diagram | Renders from source |
| Mermaid | `mermaid-theme-rerender` | Theme change | Rerenders from original source |
| Mermaid | `mermaid-invalid-syntax` | Parser failure | Preserves source and reports diagnostic |
| Mermaid | `mermaid-duplicate-id` | Namespace risk | Avoids id collision |
| JSXGraph | `jsxgraph-simple-board` | Basic board | Mounts at non-zero size |
| JSXGraph | `jsxgraph-hidden-container` | Visibility risk | Defers or repairs zero-size board |
| JSXGraph | `jsxgraph-orientation-resize` | Mobile orientation | Resizes after rotation |
| JSXGraph | `jsxgraph-duplicate-board-id` | Duplicate init risk | Prevents duplicate board ownership |
| Plotly | `plotly-2d-scatter` | Basic chart | Mounts and exports source |
| Plotly | `plotly-3d-surface` | 3D chart | Mounts and resizes after layout change |
| Plotly | `plotly-invalid-trace` | Validation failure | Reports diagnostic and preserves payload |
| Plotly | `plotly-hidden-container` | Hidden sizing | Defers or repairs zero-width plot |
| Plotly Explore | `plotly-explore-single-slider` | Control to chart update | Slider updates plot once |
| Plotly Explore | `plotly-explore-multiple-controls` | Control state | Preserves parameter state across rerender |
| Plotly Explore | `plotly-explore-invalid-range` | Validation failure | Reports parameter diagnostic |
| Plotly Explore | `plotly-explore-mobile-controls` | Touch risk | Controls remain usable on iPhone |
| Arquero | `arquero-simple-table` | Basic table | Renders rows and preserves expression |
| Arquero | `arquero-derived-table` | Transform source | Output has provenance |
| Arquero | `arquero-invalid-expression` | Validation failure | Reports diagnostic and preserves source |
| Arquero | `arquero-large-sample-cap` | Performance risk | Applies cap and reports reason |
| SVG | `svg-responsive-valid` | Responsive SVG | Scales in container |
| SVG | `svg-fixed-size-overflow` | Mobile overflow | Reports or constrains overflow risk |
| SVG | `svg-unsafe-attribute` | Safety policy | Rejects or sanitizes per accepted policy |
| SVG | `svg-duplicate-id` | Id collision | Namespaces or reports collision |
| Manim/video placeholders | `media-video-valid` | Valid video metadata | Shows responsive media placeholder/player |
| Manim/video placeholders | `media-missing-url` | Load fallback | Reports non-fatal diagnostic |
| Manim/video placeholders | `media-poster-only` | Print fallback | Keeps poster and caption source |
| Manim/video placeholders | `media-invalid-type` | Validation failure | Rejects unsupported type |
| Calculator widgets | `calculator-numeric-basic` | Pure calculation | Produces deterministic output |
| Calculator widgets | `calculator-formula-output` | Nested KaTeX | Preserves formula source |
| Calculator widgets | `calculator-plot-output` | Nested Plotly | Preserves generated plot source |
| Calculator widgets | `calculator-invalid-input` | Validation failure | Reports input diagnostic |
| Statistics widgets | `statistics-small-dataset` | Deterministic summary | Produces expected values |
| Statistics widgets | `statistics-invalid-data` | Validation failure | Reports dataset diagnostic |
| Statistics widgets | `statistics-large-capped` | Performance cap | Caps work and reports reason |
| Statistics widgets | `statistics-plot-output` | Nested Plotly | Resizes and preserves chart source |

## Fixture Metadata Required Later

Future fixture files should include renderer id, fixture id, owning lesson id, section id, block id, canonical source, expected diagnostics, expected export source, mobile risk flag, hidden-container flag, duplicate-id flag, and manual checklist ids.

## Manual Evidence Links

Future implementation PRs should add links to screenshots, recordings, console logs, or generated export files in the manual checklist. This inventory does not mark any manual checklist item as passed.
