# Phase 2 Plotly Dependency Plan

Status: planning and dependency decision slice only.

Branch: `migration/phase-2-plotly-dependency-plan`

## Subsystem

Plotly renderer adapter planning for legacy plots and Plotly Explore widgets.

## Explicit Non-Scope

This slice does not install Plotly, add runtime Plotly components, implement a Plotly adapter, execute legacy plot functions, migrate Plotly Explore controls, migrate statistics plots, change schemas, or mutate `legacy/mathlesson-v4.9.22/`.

## Baseline Evidence

The v4.9.22 app loads Plotly from `https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.32.0/plotly.min.js` in the preserved HTML.

Primary runtime behavior to preserve:

| Behavior | Evidence | Notes |
| --- | --- | --- |
| Legacy `[data-plot]` blocks revive plot functions and call them after an `IntersectionObserver` plus double `requestAnimationFrame` | `analysis/extracted-v4.9.22/019-script-module.js:1104-1129` | Hidden/zero-width rendering is an explicit risk. |
| Inactive Plotly canvases are purged outside the active panel/editor | `analysis/extracted-v4.9.22/019-script-module.js:848-857` | Cleanup must call `Plotly.purge`. |
| Theme changes call `Plotly.relayout` and `Plotly.Plots.resize` | `analysis/extracted-v4.9.22/019-script-module.js:763-767` | Adapter needs theme-aware update or resize hooks. |
| Print preparation resizes `.js-plotly-plot`, `.explore-plot`, `.stat-plot`, and `[data-plot]` | `analysis/extracted-v4.9.22/019-script-module.js:4206-4210` | Export/print parity remains future work. |
| Reveal export initializes legacy plots and resizes after render | `analysis/extracted-v4.9.22/019-script-module.js:4362-4372` | Reveal export remains non-scope for first app adapter. |
| Student export delays Explore initialization when width is under `40px` | `analysis/extracted-v4.9.22/019-script-module.js:5110-5161` | Hidden-container and mobile-width tests are required. |
| Plotly Explore 3D uses `type: "surface"` | `analysis/extracted-v4.9.22/019-script-module.js:6443-6484` | A 2D-only bundle cannot claim full Plotly Explore parity. |
| Legacy and Explore source is stored as function strings or HTML `data-*` attributes | `analysis/extracted-v4.9.22/019-script-module.js:2593-2613`, `6369-6497` | Executing source strings is a separate security/design gate. |

## Package Evidence

`npm view` evidence gathered for exact baseline-compatible package candidates:

| Package | Exact version available | License | Unpacked size | Dependencies from `npm view` | Notes |
| --- | --- | --- | ---: | --- | --- |
| `plotly.js-dist-min` | `2.32.0` | MIT | `3,635,288` bytes | None reported | Best baseline match for full CDN bundle, including 3D surface traces. |
| `plotly.js-basic-dist-min` | `2.32.0` | MIT | `1,017,849` bytes | None reported | Smaller but likely insufficient for baseline 3D Explore `surface` support. |
| `plotly.js` | `2.32.0` | MIT | `88,568,642` bytes | Many runtime dependencies | Avoid for first adapter; too broad for the current slice strategy. |
| `@types/plotly.js` | latest `3.0.10`; no `2.32.0` | MIT | `130,902` bytes | None reported | Version line does not match baseline; prefer a local structural type for first implementation. |

## Recommendation For The Next Implementation PR

Use `plotly.js-dist-min@2.32.0` as the dependency candidate if the next PR is approved to install Plotly.

Rationale:

1. It exactly matches the baseline Plotly version line.
2. It is the closest npm equivalent to the CDN bundle already used by v4.9.22.
3. It supports the baseline 3D `surface` Explore path, unlike a 2D-only bundle candidate.
4. It has no dependency tree according to `npm view`, reducing audit surface compared with `plotly.js` source packages.

Implementation must use a dynamic provider, for example `() => import('plotly.js-dist-min')`, so Plotly stays out of the initial shell path until a Plotly block is mounted.

Do not add `@types/plotly.js` in the first implementation PR unless there is a reviewed reason. Use a local structural interface covering only the methods the adapter calls: `newPlot`, `react`, `relayout`, `purge`, and `Plots.resize`.

## Source Strategy

Implement base Plotly before Plotly Explore.

The first Plotly adapter should accept explicit structured source only:

```ts
type PlotlySource = {
  sourceId: string;
  plotId: string;
  data: unknown[];
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  title?: string;
  height?: number;
};
```

The first adapter should not revive `lesson.plots` function strings and should not execute `data-fn` Explore expressions. Those are baseline behaviors, but they cross an execution-policy gate because v4.9.22 uses `Function` and `new Function` for both legacy plot registries and Explore widgets.

Add a later Plotly Explore plan or implementation slice for:

| Source | Baseline behavior | Required decision before migration |
| --- | --- | --- |
| Legacy `lesson.plots[key]` registry | Revives function strings and passes `PLOT_LAYOUT` plus target element | Whether to keep, sandbox, transform, or replace function-string execution. |
| Explore `data-fn` | Builds 2D or 3D generated traces from expression strings and slider state | Expression execution policy, parameter validation, and authoring compatibility. |
| Statistics nested Plotly | Uses computed deterministic results and Plotly for histograms, densities, regression, and survival curves | Migrate after statistics service isolation and nested renderer policy. |

## Adapter Lifecycle Requirements

The implementation PR must cover:

| Axis | Required behavior |
| --- | --- |
| Validation | Require stable `sourceId`, `plotId`, trace array, object layout/config when present, and positive finite height when present. |
| Mount | Defer until the container is visible and has measurable width; then call `Plotly.newPlot` or `Plotly.react`. |
| Update | Use `Plotly.react` for data/layout/config changes without replacing the container. |
| Resize | Call `Plotly.Plots.resize` after sidebar mode changes, wide-content toggles, theme changes, and hidden-to-visible transitions. |
| Cleanup | Call `Plotly.purge`, clear adapter-owned markers, and leave canonical source untouched. |
| Duplicate init | Detect an already mounted source in the same container and report a diagnostic instead of creating another Plotly instance. |
| Source preservation | Export canonical `PlotlySource`, never generated Plotly DOM. |
| Diagnostics | Include renderer id, plot id, trace count, container size, source excerpt, and thrown Plotly errors. |

## Test Strategy

Unit tests should use an injected fake Plotly provider. Do not rely on real Plotly inside jsdom for lifecycle assertions.

Required focused tests for the implementation PR:

1. Valid structured 2D trace source validates.
2. Invalid trace root reports diagnostics and preserves fallback source.
3. Hidden or zero-width container schedules rendering after visibility or size is available.
4. Visible container calls `newPlot` or `react` with source data, layout, and config.
5. Source update calls `react` without remounting the host.
6. Theme or layout resize calls `Plots.resize` and, where needed, `relayout`.
7. Duplicate initialization is skipped with a diagnostic.
8. Unmount calls `purge` exactly once and clears adapter-owned state.
9. Export returns canonical source after successful render and after render failure.
10. React host preserves source metadata and reports adapter diagnostics.

Manual test hook remains RND-002. jsdom cannot prove Plotly WebGL behavior, touch gestures, 3D controls, or iPhone orientation recovery.

## PR Acceptance Criteria

The next implementation PR must:

1. Install no package unless the PR explicitly approves exact `plotly.js-dist-min@2.32.0` or documents a narrower accepted alternative.
2. Run `npm ci`, `npm run check`, `npm audit --audit-level=moderate`, and `node tools/analysis/verify-phase-0.mjs` after dependency changes.
3. Keep Plotly dynamically imported and out of the initial shell bundle path.
4. Keep legacy function-string and Explore expression execution out of scope unless a separate execution-policy decision is accepted.
5. Leave `legacy/mathlesson-v4.9.22/` unchanged.

## Open Decision

Approve one of these before implementation:

| Option | Consequence |
| --- | --- |
| Full baseline package: `plotly.js-dist-min@2.32.0` | Best parity path, supports 3D, larger lazy chunk. |
| 2D-only package: `plotly.js-basic-dist-min@2.32.0` | Smaller, but cannot claim 3D Explore parity. |
| No package yet | Implement only provider-injected adapter tests and keep runtime demo disabled. |
