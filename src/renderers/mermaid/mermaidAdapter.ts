import { createAdapterDiagnostic, getSourceExcerpt } from '../core/diagnostics';
import type { AdapterDiagnostic, AdapterValidation, ExportTarget, RendererAdapter, RendererContext } from '../core/types';

const MERMAID_ADAPTER_ID = 'mermaid' as const;
const mermaidDiagramPattern = /^(flowchart|graph|sequenceDiagram|stateDiagram-v2|stateDiagram|classDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart)\b/i;

export type MermaidTheme = 'dark' | 'light';

export type MermaidSource = {
  source: string;
  diagramId: string;
  sourceId: string;
  theme: MermaidTheme;
};

export type MermaidInstance = {
  adapterId: 'mermaid';
  source: MermaidSource;
  sourceKey: string;
  renderedSvg: string;
};

export type MermaidRenderResult = {
  svg: string;
  bindFunctions?: (element: Element) => void;
};

export type MermaidRenderer = {
  initialize(config: Record<string, unknown>): void;
  render(id: string, source: string): Promise<MermaidRenderResult> | MermaidRenderResult;
};

export type MermaidRendererProvider = MermaidRenderer | (() => Promise<MermaidRenderer> | MermaidRenderer);

const mountedInstances = new WeakMap<HTMLElement, MermaidInstance>();

function isMermaidSource(value: unknown): value is MermaidSource {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MermaidSource>;
  return (
    typeof candidate.source === 'string' &&
    typeof candidate.diagramId === 'string' &&
    typeof candidate.sourceId === 'string' &&
    (candidate.theme === 'dark' || candidate.theme === 'light')
  );
}

export function getMermaidSourceKey(source: MermaidSource): string {
  return JSON.stringify({ diagramId: source.diagramId, source: source.source, sourceId: source.sourceId, theme: source.theme });
}

export function createMermaidConfig(theme: MermaidTheme): Record<string, unknown> {
  return {
    startOnLoad: false,
    theme: theme === 'light' ? 'base' : 'dark',
    darkMode: theme === 'dark',
    securityLevel: 'loose',
    flowchart: { curve: 'basis', htmlLabels: false, useMaxWidth: true },
    sequence: { mirrorActors: false, useMaxWidth: true },
  };
}

function createMermaidDiagnostic(
  severity: AdapterDiagnostic['severity'],
  code: string,
  message: string,
  source: unknown,
  cause?: unknown,
): AdapterDiagnostic {
  return createAdapterDiagnostic({
    severity,
    rendererId: MERMAID_ADAPTER_ID,
    code,
    message,
    sourceExcerpt: typeof source === 'string' ? getSourceExcerpt(source) : undefined,
    cause,
  });
}

function sanitizeMermaidSvg(svg: string): string {
  return svg
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function validateMermaid(source: unknown): AdapterValidation<MermaidSource> {
  if (!isMermaidSource(source)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        createMermaidDiagnostic(
          'error',
          'mermaid-invalid-source',
          'Mermaid source must include source, diagramId, sourceId, and theme.',
          source,
        ),
      ],
    };
  }

  const trimmedSource = source.source.trim();
  if (!trimmedSource) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createMermaidDiagnostic('error', 'mermaid-empty-source', 'Mermaid source cannot be empty.', source.source)],
    };
  }

  if (!mermaidDiagramPattern.test(trimmedSource)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        createMermaidDiagnostic('error', 'mermaid-unknown-diagram', 'Mermaid source must start with a known diagram type.', source.source),
      ],
    };
  }

  return { ok: true, source: { ...source, source: trimmedSource }, diagnostics: [] };
}

function isMermaidRenderer(renderer: MermaidRendererProvider): renderer is MermaidRenderer {
  return typeof renderer === 'object' && renderer !== null && 'render' in renderer;
}

async function resolveMermaidRenderer(renderer: MermaidRendererProvider): Promise<MermaidRenderer> {
  return isMermaidRenderer(renderer) ? renderer : renderer();
}

export function createMermaidAdapter(rendererProvider: MermaidRendererProvider): RendererAdapter<MermaidSource, MermaidInstance, MermaidSource> {
  async function mountMermaid({
    source,
    container,
    context,
  }: {
    source: MermaidSource;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<MermaidInstance> {
    const sourceKey = getMermaidSourceKey(source);
    const existing = mountedInstances.get(container);
    if (existing?.sourceKey === sourceKey) {
      context.reportDiagnostic(
        createAdapterDiagnostic({
          severity: 'info',
          rendererId: MERMAID_ADAPTER_ID,
          code: 'mermaid-duplicate-mount-skipped',
          message: 'Mermaid mount skipped because this source is already rendered in the container.',
          lessonId: context.lessonId,
          sectionId: context.sectionId,
          blockId: context.blockId,
          sourceExcerpt: getSourceExcerpt(source.source),
        }),
      );
      return existing;
    }

    if (!context.isVisible) {
      context.reportDiagnostic(
        createAdapterDiagnostic({
          severity: 'warning',
          rendererId: MERMAID_ADAPTER_ID,
          code: 'mermaid-hidden-container',
          message: 'Mermaid container is hidden; rendering should be scheduled after it becomes visible.',
          lessonId: context.lessonId,
          sectionId: context.sectionId,
          blockId: context.blockId,
          sourceExcerpt: getSourceExcerpt(source.source),
        }),
      );
    }

    try {
      const renderer = await resolveMermaidRenderer(rendererProvider);
      renderer.initialize(createMermaidConfig(source.theme));
      const result = await renderer.render(source.diagramId, source.source);
      const renderedSvg = sanitizeMermaidSvg(result.svg || '');
      container.innerHTML = renderedSvg;
      container.dataset.rendererAdapter = MERMAID_ADAPTER_ID;
      container.dataset.rendererSourceId = source.sourceId;
      if (result.bindFunctions) result.bindFunctions(container);

      const instance: MermaidInstance = { adapterId: MERMAID_ADAPTER_ID, source, sourceKey, renderedSvg };
      mountedInstances.set(container, instance);
      return instance;
    } catch (error) {
      context.reportDiagnostic(
        createMermaidDiagnostic('error', 'mermaid-render-error', 'Mermaid could not render this source.', source.source, error),
      );
      container.textContent = source.source;
      throw error;
    }
  }

  async function updateMermaid({
    source,
    instance,
    container,
    context,
  }: {
    source: MermaidSource;
    instance: MermaidInstance;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<MermaidInstance> {
    if (instance.sourceKey === getMermaidSourceKey(source)) return instance;
    unmountMermaid({ instance, container, context });
    return mountMermaid({ source, container, context });
  }

  function exportMermaid({
    source,
    target,
  }: {
    source: MermaidSource;
    instance: MermaidInstance | null;
    target: ExportTarget;
    context: RendererContext;
  }) {
    if (target.kind === 'json') return source;
    return source;
  }

  function unmountMermaid({ instance, container }: { instance: MermaidInstance; container: HTMLElement; context: RendererContext }): void {
    if (mountedInstances.get(container) !== instance) return;
    container.innerHTML = '';
    delete container.dataset.rendererAdapter;
    delete container.dataset.rendererSourceId;
    mountedInstances.delete(container);
  }

  return {
    id: MERMAID_ADAPTER_ID,
    displayName: 'Mermaid',
    validate: validateMermaid,
    mount: mountMermaid,
    update: updateMermaid,
    export: exportMermaid,
    unmount: unmountMermaid,
  };
}

let mermaidRendererPromise: Promise<MermaidRenderer> | null = null;

function loadMermaidRenderer(): Promise<MermaidRenderer> {
  mermaidRendererPromise ??= import('mermaid').then((module) => module.default as unknown as MermaidRenderer);
  return mermaidRendererPromise;
}

export const mermaidAdapter = createMermaidAdapter(loadMermaidRenderer);
