import katex, { type KatexOptions } from 'katex';
import { createAdapterDiagnostic, getSourceExcerpt } from '../core/diagnostics';
import type { AdapterDiagnostic, AdapterValidation, ExportTarget, RendererAdapter, RendererContext } from '../core/types';

const KATEX_ADAPTER_ID = 'katex' as const;

export type KaTeXSource = {
  tex: string;
  displayMode: boolean;
  sourceId: string;
};

export type KaTeXInstance = {
  adapterId: 'katex';
  source: KaTeXSource;
  sourceKey: string;
  renderedHtml: string;
};

const mountedInstances = new WeakMap<HTMLElement, KaTeXInstance>();

function isKaTeXSource(value: unknown): value is KaTeXSource {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<KaTeXSource>;
  return (
    typeof candidate.tex === 'string' &&
    typeof candidate.displayMode === 'boolean' &&
    typeof candidate.sourceId === 'string'
  );
}

export function getKaTeXSourceKey(source: KaTeXSource): string {
  return JSON.stringify({ displayMode: source.displayMode, sourceId: source.sourceId, tex: source.tex });
}

function createKaTeXDiagnostic(
  code: string,
  message: string,
  source: unknown,
  cause?: unknown,
): AdapterDiagnostic {
  return createAdapterDiagnostic({
    severity: 'error',
    rendererId: KATEX_ADAPTER_ID,
    code,
    message,
    sourceExcerpt: typeof source === 'string' ? getSourceExcerpt(source) : undefined,
    cause,
  });
}

function renderKaTeXToString(source: KaTeXSource): string {
  const options: KatexOptions = {
    displayMode: source.displayMode,
    throwOnError: true,
    trust: false,
  };
  return katex.renderToString(source.tex, options);
}

function validateKaTeX(source: unknown): AdapterValidation<KaTeXSource> {
  if (!isKaTeXSource(source)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        createKaTeXDiagnostic('katex-invalid-source', 'KaTeX source must include tex, displayMode, and sourceId.', source),
      ],
    };
  }

  if (!source.tex.trim()) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createKaTeXDiagnostic('katex-empty-source', 'KaTeX source cannot be empty.', source.tex)],
    };
  }

  try {
    renderKaTeXToString(source);
    return { ok: true, source, diagnostics: [] };
  } catch (error) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createKaTeXDiagnostic('katex-render-error', 'KaTeX could not render this source.', source.tex, error)],
    };
  }
}

function mountKaTeX({
  source,
  container,
  context,
}: {
  source: KaTeXSource;
  container: HTMLElement;
  context: RendererContext;
}): KaTeXInstance {
  const sourceKey = getKaTeXSourceKey(source);
  const existing = mountedInstances.get(container);
  if (existing?.sourceKey === sourceKey) {
    context.reportDiagnostic(
      createAdapterDiagnostic({
        severity: 'info',
        rendererId: KATEX_ADAPTER_ID,
        code: 'katex-duplicate-mount-skipped',
        message: 'KaTeX mount skipped because this source is already rendered in the container.',
        lessonId: context.lessonId,
        sectionId: context.sectionId,
        blockId: context.blockId,
        sourceExcerpt: getSourceExcerpt(source.tex),
      }),
    );
    return existing;
  }

  const renderedHtml = renderKaTeXToString(source);
  container.innerHTML = renderedHtml;
  container.dataset.rendererAdapter = KATEX_ADAPTER_ID;
  container.dataset.rendererSourceId = source.sourceId;

  const instance: KaTeXInstance = { adapterId: KATEX_ADAPTER_ID, source, sourceKey, renderedHtml };
  mountedInstances.set(container, instance);
  return instance;
}

function updateKaTeX({
  source,
  instance,
  container,
  context,
}: {
  source: KaTeXSource;
  instance: KaTeXInstance;
  container: HTMLElement;
  context: RendererContext;
}): KaTeXInstance {
  if (instance.sourceKey === getKaTeXSourceKey(source)) return instance;
  unmountKaTeX({ instance, container, context });
  return mountKaTeX({ source, container, context });
}

function exportKaTeX({
  source,
  target,
}: {
  source: KaTeXSource;
  instance: KaTeXInstance | null;
  target: ExportTarget;
  context: RendererContext;
}) {
  if (target.kind === 'json') return source;
  return source;
}

function unmountKaTeX({
  instance,
  container,
}: {
  instance: KaTeXInstance;
  container: HTMLElement;
  context: RendererContext;
}): void {
  if (mountedInstances.get(container) !== instance) return;
  container.innerHTML = '';
  delete container.dataset.rendererAdapter;
  delete container.dataset.rendererSourceId;
  mountedInstances.delete(container);
}

export const katexAdapter = {
  id: KATEX_ADAPTER_ID,
  displayName: 'KaTeX',
  validate: validateKaTeX,
  mount: mountKaTeX,
  update: updateKaTeX,
  export: exportKaTeX,
  unmount: unmountKaTeX,
} satisfies RendererAdapter<KaTeXSource, KaTeXInstance, KaTeXSource>;
