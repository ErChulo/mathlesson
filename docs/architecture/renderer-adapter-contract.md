# Renderer Adapter Contract

Status: planning-only pseudocode. No production TypeScript files are created by this document.

This branch does not implement renderer adapters. It defines the contract, fixtures, test strategy, and acceptance criteria required before implementation.

## Non-Scope

This document does not add runtime renderer components, install dependencies, migrate MathLive, change schemas, or mutate the preserved v4.9.22 baseline.

## Design Principle

React owns stable containers and application state. Renderer adapters own third-party lifecycle details. Production React code added later should call adapters through a narrow host boundary and should not call KaTeX, MathLive, Mermaid, JSXGraph, Plotly, Arquero, SVG, calculator, statistics, or media renderer internals directly.

## Adapter Interface Pseudocode

```ts
export interface RendererAdapter<TSource, TInstance, TExport = unknown> {
  readonly id: string;
  readonly displayName: string;

  validate(source: unknown): AdapterValidation<TSource>;

  mount(args: {
    source: TSource;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<TInstance> | TInstance;

  update?(args: {
    source: TSource;
    instance: TInstance;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<TInstance> | TInstance;

  resize?(args: {
    instance: TInstance;
    container: HTMLElement;
    context: RendererContext;
  }): void;

  export?(args: {
    source: TSource;
    instance: TInstance | null;
    target: ExportTarget;
    context: RendererContext;
  }): Promise<TExport> | TExport;

  unmount(args: {
    instance: TInstance;
    container: HTMLElement;
    context: RendererContext;
  }): void;
}
```

## Supporting Type Pseudocode

```ts
export type RendererContext = {
  lessonId: string;
  sectionId: string;
  blockId: string;
  rendererId: string;
  phase: 'app' | 'student-export' | 'reveal-export' | 'print' | 'pdf';
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  isMobile: boolean;
  isVisible: boolean;
  containerSize: { width: number; height: number };
  reportDiagnostic(diagnostic: AdapterDiagnostic): void;
  scheduleAfterVisible(callback: () => void): void;
};

export type ExportTarget =
  | { kind: 'json' }
  | { kind: 'student-html' }
  | { kind: 'reveal-html' }
  | { kind: 'print-dom' }
  | { kind: 'pdf-source' };

export type AdapterValidation<TSource> =
  | { ok: true; source: TSource; diagnostics: AdapterDiagnostic[] }
  | { ok: false; fallbackSource: unknown; diagnostics: AdapterDiagnostic[] };

export type AdapterDiagnostic = {
  severity: 'info' | 'warning' | 'error';
  rendererId: string;
  code: string;
  message: string;
  lessonId?: string;
  sectionId?: string;
  blockId?: string;
  sourceExcerpt?: string;
  cause?: unknown;
};

export type AdapterLifecycleState =
  | 'idle'
  | 'validated'
  | 'waiting-for-visible-container'
  | 'mounted'
  | 'updated'
  | 'resized'
  | 'exported'
  | 'unmounted'
  | 'failed';
```

## Lifecycle Rules

1. Validate before mount. Invalid source produces diagnostics and fallback display, not a fatal app crash.
2. Mount only into a stable container owned by one adapter instance.
3. Defer mount for renderers that require non-zero dimensions when the container is hidden.
4. Update from canonical source, never from generated DOM or generated SVG.
5. Resize only after the container is visible and layout has settled.
6. Export from canonical source and explicit target policy, not by scraping runtime DOM unless a later accepted adapter requires a static artifact.
7. Unmount every instance before replacing containers or navigating away.
8. Duplicate initialization must be detected by instance markers and treated as an error diagnostic in tests.

## Container Contract

Renderer hosts added later must provide a single stable `HTMLElement`, a block identity, visibility state, dimensions, theme, reduced-motion state, and diagnostics callback. Hosts must not mutate preserved source while mounting a renderer.

## Source Preservation Contract

The adapter source object is canonical. Generated DOM, generated SVG, Plotly instances, JSXGraph boards, MathLive fields, tables, charts, and media elements are runtime artifacts. Authoring, JSON export, student export, Reveal export, print, PDF, and diagnostics must be able to access original source even if rendering fails.

Renderer hosts and adapters may expose stable ids such as `data-source-id` for diagnostics and test targeting. They must not expose raw source, full serialized source objects, or serialized source keys through DOM attributes or `dataset` fields.

## Diagnostics Contract

Diagnostics are non-fatal unless an adapter corrupts source, mutates another adapter container, or leaves duplicate live instances after unmount. Diagnostics must include renderer id and block id whenever available.

## Fixture Categories

1. Valid minimal source.
2. Valid complex source.
3. Invalid source that must remain exportable.
4. Hidden-container source.
5. Duplicate-id or duplicate-initialization source.
6. Resize and orientation source.
7. Mobile-risk source.
8. Export-source preservation source.
9. Cleanup and remount source.
10. Nested renderer source, such as statistics output using Plotly or KaTeX.

## Test Matrix

| Test axis | Required coverage |
| --- | --- |
| Validation | Accept valid source, reject invalid source with diagnostics, preserve fallback source |
| Mount | Mount into visible container and report useful failure for invalid container |
| Hidden container | Defer or repair rendering after visibility changes |
| Update | Update from source without duplicate initialization |
| Cleanup | Remove instances, listeners, and generated DOM owned by adapter |
| Resize/orientation | Recover after sidebar, wide layout, mobile portrait, and mobile landscape changes |
| Source preservation | Export canonical source after render failure and after rerender |
| Diagnostics | Include renderer id, block id, source excerpt, and severity |
| Manual hooks | Link automated cases to checklist ids in `docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md` |

## Manual Real-Device Checklist Hooks

Adapter implementation PRs must reference the manual checklist ids they affect. MathLive requires ML-001 through ML-009 on real iPhone Safari before parity claims. Renderer adapters that depend on dimensions must reference RND-001 through RND-008 as applicable.

## Implementation Gate

No renderer implementation should start until this contract, the fixture inventory, and the renderer adapter test plan are reviewed and accepted.
