import { createAdapterDiagnostic, getSourceExcerpt } from '../core/diagnostics';
import type { AdapterDiagnostic, AdapterValidation, ExportTarget, RendererAdapter, RendererContext } from '../core/types';

const PLOTLY_ADAPTER_ID = 'plotly' as const;
const minimumUsableWidth = 40;

export type PlotlyTrace = Record<string, unknown>;
export type PlotlyLayout = Record<string, unknown>;
export type PlotlyConfig = Record<string, unknown>;

export type PlotlySource = {
  sourceId: string;
  plotId: string;
  data: PlotlyTrace[];
  layout?: PlotlyLayout;
  config?: PlotlyConfig;
  title?: string;
  height?: number;
};

export type PlotlyCallResult = Promise<unknown> | unknown;

export type PlotlyRenderer = {
  newPlot(container: HTMLElement, data: PlotlyTrace[], layout: PlotlyLayout, config: PlotlyConfig): PlotlyCallResult;
  react(container: HTMLElement, data: PlotlyTrace[], layout: PlotlyLayout, config: PlotlyConfig): PlotlyCallResult;
  relayout(container: HTMLElement, update: PlotlyLayout): PlotlyCallResult;
  purge(container: HTMLElement): PlotlyCallResult;
  Plots: {
    resize(container: HTMLElement): PlotlyCallResult;
  };
};

export type PlotlyRendererProvider = PlotlyRenderer | (() => Promise<PlotlyRenderer> | PlotlyRenderer);

export type PlotlyInstance = {
  adapterId: 'plotly';
  source: PlotlySource;
  sourceKey: string;
  renderer: PlotlyRenderer | null;
  mounted: boolean;
};

const mountedInstances = new WeakMap<HTMLElement, PlotlyInstance>();

const themePalettes = {
  dark: {
    text: '#e6edf3',
    muted: '#9ca3af',
    border: '#303846',
  },
  light: {
    text: '#111827',
    muted: '#5b6472',
    border: '#cfd9e8',
  },
} satisfies Record<RendererContext['theme'], Record<string, string>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalRecord(value: unknown): value is Record<string, unknown> | undefined {
  return value === undefined || isRecord(value);
}

function isValidHeight(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value > 0);
}

function isPlotlySource(value: unknown): value is PlotlySource {
  if (!isRecord(value)) return false;
  return (
    typeof value.sourceId === 'string' &&
    typeof value.plotId === 'string' &&
    Array.isArray(value.data) &&
    value.data.every(isRecord) &&
    isOptionalRecord(value.layout) &&
    isOptionalRecord(value.config) &&
    isOptionalString(value.title) &&
    isValidHeight(value.height)
  );
}

export function serializePlotlySource(source: PlotlySource): string {
  try {
    return JSON.stringify({
      sourceId: source.sourceId,
      plotId: source.plotId,
      data: source.data,
      layout: source.layout ?? null,
      config: source.config ?? null,
      title: source.title ?? '',
      height: source.height ?? null,
    });
  } catch {
    return JSON.stringify({ sourceId: source.sourceId, plotId: source.plotId, unserializable: true });
  }
}

export function getPlotlySourceKey(source: PlotlySource): string {
  return serializePlotlySource(source);
}

function sourceExcerpt(source: unknown): string | undefined {
  if (typeof source === 'string') return getSourceExcerpt(source);
  try {
    return getSourceExcerpt(JSON.stringify(source));
  } catch {
    return undefined;
  }
}

function createPlotlyDiagnostic(
  severity: AdapterDiagnostic['severity'],
  code: string,
  message: string,
  source: unknown,
  cause?: unknown,
  context?: RendererContext,
): AdapterDiagnostic {
  return createAdapterDiagnostic({
    severity,
    rendererId: PLOTLY_ADAPTER_ID,
    code,
    message,
    lessonId: context?.lessonId,
    sectionId: context?.sectionId,
    blockId: context?.blockId,
    sourceExcerpt: sourceExcerpt(source),
    cause,
  });
}

function invalidPlotlySource(source: unknown, code: string, message: string): AdapterValidation<PlotlySource> {
  return {
    ok: false,
    fallbackSource: source,
    diagnostics: [createPlotlyDiagnostic('error', code, message, source)],
  };
}

function validatePlotly(source: unknown): AdapterValidation<PlotlySource> {
  if (!isPlotlySource(source)) {
    return invalidPlotlySource(
      source,
      'plotly-invalid-source',
      'Plotly source must include sourceId, plotId, trace data, and optional object layout/config.',
    );
  }

  if (!source.sourceId.trim()) {
    return invalidPlotlySource(source, 'plotly-missing-source-id', 'Plotly sourceId cannot be empty.');
  }

  if (!source.plotId.trim()) {
    return invalidPlotlySource(source, 'plotly-missing-plot-id', 'Plotly plotId cannot be empty.');
  }

  if (!source.data.length) {
    return invalidPlotlySource(source, 'plotly-empty-data', 'Plotly source must include at least one trace.');
  }

  return { ok: true, source: { ...source, sourceId: source.sourceId.trim(), plotId: source.plotId.trim() }, diagnostics: [] };
}

export function createPlotlyBaseLayout(theme: RendererContext['theme']): PlotlyLayout {
  const palette = themePalettes[theme];
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: palette.text, family: 'Segoe UI,system-ui,sans-serif', size: 12 },
    margin: { t: 10, b: 48, l: 48, r: 16 },
    xaxis: { gridcolor: palette.border, zerolinecolor: palette.border, color: palette.muted, linecolor: palette.border },
    yaxis: { gridcolor: palette.border, zerolinecolor: palette.border, color: palette.muted, linecolor: palette.border },
    legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: palette.border, font: { color: palette.text } },
  };
}

export function createPlotlyThemeRelayout(theme: RendererContext['theme']): PlotlyLayout {
  const palette = themePalettes[theme];
  return {
    'font.color': palette.text,
    'xaxis.gridcolor': palette.border,
    'xaxis.zerolinecolor': palette.border,
    'xaxis.color': palette.muted,
    'xaxis.linecolor': palette.border,
    'yaxis.gridcolor': palette.border,
    'yaxis.zerolinecolor': palette.border,
    'yaxis.color': palette.muted,
    'yaxis.linecolor': palette.border,
    'legend.bordercolor': palette.border,
    'legend.font.color': palette.text,
    'scene.xaxis.gridcolor': palette.border,
    'scene.xaxis.zerolinecolor': palette.border,
    'scene.xaxis.color': palette.muted,
    'scene.yaxis.gridcolor': palette.border,
    'scene.yaxis.zerolinecolor': palette.border,
    'scene.yaxis.color': palette.muted,
    'scene.zaxis.gridcolor': palette.border,
    'scene.zaxis.zerolinecolor': palette.border,
    'scene.zaxis.color': palette.muted,
    'scene.bgcolor': 'rgba(0,0,0,0)',
  };
}

function createPlotlyLayout(source: PlotlySource, context: RendererContext): PlotlyLayout {
  const layout: PlotlyLayout = { ...createPlotlyBaseLayout(context.theme), ...(source.layout ?? {}) };
  if (source.height !== undefined && layout.height === undefined) layout.height = source.height;
  if (source.title && layout.title === undefined) layout.title = { text: source.title };
  return layout;
}

function createPlotlyConfig(source: PlotlySource): PlotlyConfig {
  return { displayModeBar: false, responsive: true, ...(source.config ?? {}) };
}

function applyContainerMetadata(container: HTMLElement, source: PlotlySource, sourceKey: string): void {
  container.dataset.rendererAdapter = PLOTLY_ADAPTER_ID;
  container.dataset.rendererSourceId = source.sourceId;
  container.dataset.rendererSourceKey = sourceKey;
  container.dataset.plotlyPlotId = source.plotId;
  container.dataset.plotlySource = serializePlotlySource(source);
  container.dataset.plotlyTraceCount = String(source.data.length);

  if (source.height !== undefined) {
    container.style.minHeight = `${source.height}px`;
  } else {
    container.style.minHeight = '';
  }
}

function isPlotlyRenderer(renderer: PlotlyRendererProvider): renderer is PlotlyRenderer {
  return typeof renderer === 'object' && renderer !== null && 'newPlot' in renderer;
}

async function resolvePlotlyRenderer(renderer: PlotlyRendererProvider): Promise<PlotlyRenderer> {
  return isPlotlyRenderer(renderer) ? renderer : renderer();
}

function shouldDeferRender(container: HTMLElement, context: RendererContext): boolean {
  const rectWidth = container.getBoundingClientRect?.().width ?? 0;
  const width = Math.max(context.containerSize.width, container.clientWidth, rectWidth);
  return !context.isVisible || width < minimumUsableWidth;
}

function reportDeferredRender(source: PlotlySource, container: HTMLElement, context: RendererContext): void {
  const rectWidth = container.getBoundingClientRect?.().width ?? 0;
  const width = Math.max(context.containerSize.width, container.clientWidth, rectWidth);
  const code = !context.isVisible ? 'plotly-hidden-container' : 'plotly-zero-width-container';
  const message = !context.isVisible
    ? 'Plotly container is hidden; rendering is deferred until visible.'
    : 'Plotly container width is below the usable threshold; rendering is deferred until layout settles.';
  context.reportDiagnostic(createPlotlyDiagnostic('warning', code, message, { source, width }, undefined, context));
}

async function renderInitialPlotly(
  instance: PlotlyInstance,
  container: HTMLElement,
  context: RendererContext,
  rendererProvider: PlotlyRendererProvider,
): Promise<PlotlyInstance> {
  try {
    const renderer = await resolvePlotlyRenderer(rendererProvider);
    if (mountedInstances.get(container) !== instance) return instance;

    await renderer.newPlot(container, instance.source.data, createPlotlyLayout(instance.source, context), createPlotlyConfig(instance.source));
    if (mountedInstances.get(container) !== instance) return instance;

    instance.renderer = renderer;
    instance.mounted = true;
    container.dataset.plotlyRendered = '1';
    return instance;
  } catch (error) {
    if (mountedInstances.get(container) === instance) {
      container.textContent = 'Plotly could not render this source.';
      context.reportDiagnostic(
        createPlotlyDiagnostic('error', 'plotly-render-error', 'Plotly could not render this source.', instance.source, error, context),
      );
    }
    throw error;
  }
}

function reportAsyncPlotlyError(source: PlotlySource, context: RendererContext, code: string, message: string, promise: Promise<unknown>): void {
  promise.catch((error) => {
    context.reportDiagnostic(createPlotlyDiagnostic('warning', code, message, source, error, context));
  });
}

export function createPlotlyAdapter(rendererProvider: PlotlyRendererProvider): RendererAdapter<PlotlySource, PlotlyInstance, PlotlySource> {
  async function mountPlotly({
    source,
    container,
    context,
  }: {
    source: PlotlySource;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<PlotlyInstance> {
    const sourceKey = getPlotlySourceKey(source);
    const existing = mountedInstances.get(container);
    if (existing?.sourceKey === sourceKey) {
      context.reportDiagnostic(
        createAdapterDiagnostic({
          severity: 'info',
          rendererId: PLOTLY_ADAPTER_ID,
          code: 'plotly-duplicate-mount-skipped',
          message: 'Plotly mount skipped because this source is already rendered in the container.',
          lessonId: context.lessonId,
          sectionId: context.sectionId,
          blockId: context.blockId,
          sourceExcerpt: sourceExcerpt(source),
        }),
      );
      return existing;
    }

    if (existing) unmountPlotly({ instance: existing, container, context });

    container.innerHTML = '';
    applyContainerMetadata(container, source, sourceKey);

    const instance: PlotlyInstance = {
      adapterId: PLOTLY_ADAPTER_ID,
      source,
      sourceKey,
      renderer: null,
      mounted: false,
    };
    mountedInstances.set(container, instance);

    if (shouldDeferRender(container, context)) {
      reportDeferredRender(source, container, context);
      context.scheduleAfterVisible(() => {
        if (mountedInstances.get(container) !== instance) return;
        reportAsyncPlotlyError(
          source,
          context,
          'plotly-deferred-render-error',
          'Deferred Plotly render failed.',
          renderInitialPlotly(instance, container, context, rendererProvider),
        );
      });
      return instance;
    }

    return renderInitialPlotly(instance, container, context, rendererProvider);
  }

  async function updatePlotly({
    source,
    instance,
    container,
    context,
  }: {
    source: PlotlySource;
    instance: PlotlyInstance;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<PlotlyInstance> {
    const sourceKey = getPlotlySourceKey(source);
    if (instance.sourceKey === sourceKey) return instance;

    if (source.plotId !== instance.source.plotId || !instance.renderer || !instance.mounted) {
      unmountPlotly({ instance, container, context });
      return mountPlotly({ source, container, context });
    }

    try {
      applyContainerMetadata(container, source, sourceKey);
      await instance.renderer.react(container, source.data, createPlotlyLayout(source, context), createPlotlyConfig(source));
      if (mountedInstances.get(container) !== instance) return instance;

      instance.source = source;
      instance.sourceKey = sourceKey;
      return instance;
    } catch (error) {
      context.reportDiagnostic(createPlotlyDiagnostic('error', 'plotly-update-error', 'Plotly could not update this source.', source, error, context));
      throw error;
    }
  }

  function resizePlotly({ instance, container, context }: { instance: PlotlyInstance; container: HTMLElement; context: RendererContext }): void {
    if (mountedInstances.get(container) !== instance || !instance.renderer || !instance.mounted) return;

    try {
      const relayoutResult = instance.renderer.relayout(container, createPlotlyThemeRelayout(context.theme));
      if (relayoutResult instanceof Promise) {
        reportAsyncPlotlyError(instance.source, context, 'plotly-relayout-error', 'Plotly theme relayout failed.', relayoutResult);
      }
      const resizeResult = instance.renderer.Plots.resize(container);
      if (resizeResult instanceof Promise) {
        reportAsyncPlotlyError(instance.source, context, 'plotly-resize-error', 'Plotly resize failed.', resizeResult);
      }
    } catch (error) {
      context.reportDiagnostic(createPlotlyDiagnostic('warning', 'plotly-resize-error', 'Plotly resize failed.', instance.source, error, context));
    }
  }

  function exportPlotly({ source, target }: { source: PlotlySource; instance: PlotlyInstance | null; target: ExportTarget; context: RendererContext }) {
    if (target.kind === 'json') return source;
    return source;
  }

  function unmountPlotly({ instance, container, context }: { instance: PlotlyInstance; container: HTMLElement; context: RendererContext }): void {
    if (mountedInstances.get(container) !== instance) return;

    if (instance.renderer && instance.mounted) {
      try {
        const purgeResult = instance.renderer.purge(container);
        if (purgeResult instanceof Promise) {
          reportAsyncPlotlyError(instance.source, context, 'plotly-purge-error', 'Plotly purge failed during cleanup.', purgeResult);
        }
      } catch (error) {
        context.reportDiagnostic(createPlotlyDiagnostic('warning', 'plotly-purge-error', 'Plotly purge failed during cleanup.', instance.source, error, context));
      }
    }

    container.innerHTML = '';
    container.style.minHeight = '';
    delete container.dataset.rendererAdapter;
    delete container.dataset.rendererSourceId;
    delete container.dataset.rendererSourceKey;
    delete container.dataset.plotlyPlotId;
    delete container.dataset.plotlyRendered;
    delete container.dataset.plotlySource;
    delete container.dataset.plotlyTraceCount;
    mountedInstances.delete(container);
  }

  return {
    id: PLOTLY_ADAPTER_ID,
    displayName: 'Plotly',
    validate: validatePlotly,
    mount: mountPlotly,
    update: updatePlotly,
    resize: resizePlotly,
    export: exportPlotly,
    unmount: unmountPlotly,
  };
}

let plotlyRendererPromise: Promise<PlotlyRenderer> | null = null;

function loadPlotlyRenderer(): Promise<PlotlyRenderer> {
  plotlyRendererPromise ??= import('plotly.js-dist-min').then((module) => {
    const candidate = (module as { default?: unknown }).default ?? module;
    return candidate as PlotlyRenderer;
  });
  return plotlyRendererPromise;
}

export const plotlyAdapter = createPlotlyAdapter(loadPlotlyRenderer);
