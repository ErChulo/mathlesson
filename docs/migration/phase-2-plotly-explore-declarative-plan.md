# Phase 2 Plotly Explore Declarative Plan

Status: planning only. No runtime implementation, schema migration, or arbitrary expression execution is added by this document.

Branch: `migration/phase-2-plotly-explore-declarative-plan`

## Subsystem

Plotly Explore widgets for slider-driven 2D curves and 3D surfaces.

## Baseline Evidence

The v4.9.22 baseline stores Explore widgets in HTML `data-*` attributes and evaluates `data-fn` strings with `new Function`.

| Baseline path | Evidence | Risk |
| --- | --- | --- |
| 2D Explore reads `data-fn`, `data-params`, and `data-xrange`, then constructs `new Function('x', 'p', ...)` | `analysis/extracted-v4.9.22/019-script-module.js:6370-6424` | Executes lesson-authored JavaScript. |
| 3D Explore reads `data-fn`, ranges, and params, then constructs `new Function('x', 'y', 'p', ...)` | `analysis/extracted-v4.9.22/019-script-module.js:6426-6496` | Executes lesson-authored JavaScript and can generate large surfaces. |
| Student export has similar 2D/3D runtime paths and waits for usable width | `analysis/extracted-v4.9.22/019-script-module.js:5109-5184` | Export runtime repeats the same execution risk. |

ADR-0010 forbids preserving this `new Function` behavior as hidden compatibility behavior. ADR-0011 accepts the current lazy Plotly package cost but does not approve new Plotly execution paths.

## Declarative Source Recommendation

Represent Explore widgets as typed declarative source objects rather than raw HTML `data-fn` strings.

```ts
type PlotlyExploreSource = {
  sourceId: string;
  exploreId: string;
  kind: 'plotly-explore-2d' | 'plotly-explore-3d';
  title?: string;
  expression: ExploreExpression;
  parameters: ExploreParameter[];
  xRange: ExploreRange;
  yRange?: ExploreRange;
  samples?: number;
  height?: number;
};

type ExploreRange = {
  min: number;
  max: number;
};

type ExploreParameter = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
};
```

The expression should be a declarative AST, not a JavaScript source string. Initial allowed nodes should be intentionally small:

```ts
type ExploreExpression =
  | { op: 'constant'; value: number }
  | { op: 'variable'; name: 'x' | 'y' }
  | { op: 'parameter'; id: string }
  | { op: 'negate'; value: ExploreExpression }
  | { op: 'add' | 'subtract' | 'multiply' | 'divide' | 'pow'; left: ExploreExpression; right: ExploreExpression }
  | { op: 'sin' | 'cos' | 'tan' | 'sqrt' | 'abs' | 'exp' | 'log'; value: ExploreExpression };
```

No `Function`, `eval`, property access, member calls, assignment, loops, imports, globals, DOM access, network access, or user-defined functions are allowed.

## Validation Policy

An implementation slice must validate before rendering:

1. `sourceId` and `exploreId` are non-empty stable ids.
2. `kind` determines whether variable `y` and `yRange` are allowed or required.
3. Parameter ids are unique and referenced parameters exist.
4. Ranges are finite and `min < max`.
5. Parameter `min`, `max`, `step`, and `value` are finite, `step > 0`, and `value` is inside the range.
6. `samples` is finite and capped. Initial cap should be 400 for 2D and 80 per axis for 3D.
7. Expression depth and node count are capped to prevent pathological evaluation.
8. Evaluation returns finite numbers; invalid points become `null`, not thrown app errors.

## Rendering Policy

The adapter should generate ordinary structured `PlotlySource` data from the declarative source and then reuse the base Plotly adapter where practical.

2D output should generate one scatter line trace. 3D output should generate one surface trace. Slider updates should recompute traces from the AST and call `Plotly.react` through the adapter boundary.

Hidden-container behavior, resize, cleanup, diagnostics, export, and source preservation should follow the base Plotly adapter contract.

## Import Policy

Imported v4.9.22 Explore widgets that still contain `data-fn` strings must not execute by default.

Acceptable importer behavior before a migration design is approved:

1. Reject executable `data-fn` content with a safe fallback diagnostic.
2. Preserve the original imported source as inert text or metadata only if needed for author review.
3. Convert only known-safe declarative fixtures or explicitly mapped expressions.

Automatic conversion from arbitrary JavaScript expression strings to AST is not approved by this plan.

## Tests Required Before Implementation Merge

1. Validation accepts minimal 2D and 3D declarative sources.
2. Validation rejects unknown ops, unknown parameters, invalid ranges, non-finite values, and over-budget expression trees.
3. Evaluator handles arithmetic and allowed math ops without `Function` or `eval`.
4. 2D generation produces a structured Plotly scatter source.
5. 3D generation produces a structured Plotly surface source.
6. Slider parameter updates recompute traces and use `Plotly.react` through the adapter boundary.
7. Invalid evaluation points become `null` and produce diagnostics without crashing.
8. Export returns the declarative source, not generated Plotly DOM or traces unless a later export policy requires derived data.
9. Imported baseline `data-fn` content is rejected or preserved inertly without execution.
10. `npm run safety:guard` continues to reject `Function`, `eval`, and DOM source serialization.

## Explicit Non-Scope

This plan does not implement Plotly Explore.

It does not parse arbitrary JavaScript expression strings.

It does not execute baseline `data-fn` strings.

It does not migrate JSXGraph, Arquero, calculator execution, statistics execution, authoring execution, MathLive, import/export runtimes, print/PDF, Reveal export, or student export.

It does not define a persisted schema migration. If the implementation needs persisted lesson schema changes, that is a separate human decision gate.

## Implementation Gate

Do not implement Plotly Explore until this declarative source shape, expression grammar, sample caps, import behavior, and persistence implications are reviewed and accepted.
