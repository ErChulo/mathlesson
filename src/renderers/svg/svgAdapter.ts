import { createAdapterDiagnostic, getSourceExcerpt } from '../core/diagnostics';
import type { AdapterDiagnostic, AdapterValidation, ExportTarget, RendererAdapter, RendererContext } from '../core/types';

const SVG_ADAPTER_ID = 'svg' as const;

export type SvgSource = {
  markup: string;
  sourceId: string;
  title?: string;
};

export type SvgInstance = {
  adapterId: 'svg';
  source: SvgSource;
  sourceKey: string;
  renderedMarkup: string;
};

const mountedInstances = new WeakMap<HTMLElement, SvgInstance>();

function isSvgSource(value: unknown): value is SvgSource {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SvgSource>;
  return (
    typeof candidate.markup === 'string' &&
    typeof candidate.sourceId === 'string' &&
    (candidate.title === undefined || typeof candidate.title === 'string')
  );
}

export function getSvgSourceKey(source: SvgSource): string {
  return JSON.stringify({ markup: source.markup, sourceId: source.sourceId, title: source.title ?? '' });
}

function createSvgDiagnostic(
  severity: AdapterDiagnostic['severity'],
  code: string,
  message: string,
  source: unknown,
  cause?: unknown,
): AdapterDiagnostic {
  return createAdapterDiagnostic({
    severity,
    rendererId: SVG_ADAPTER_ID,
    code,
    message,
    sourceExcerpt: typeof source === 'string' ? getSourceExcerpt(source) : undefined,
    cause,
  });
}

function parseSvg(source: SvgSource): SVGSVGElement {
  const doc = new DOMParser().parseFromString(source.markup, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error(parserError.textContent || 'Invalid SVG markup.');

  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') {
    throw new Error('SVG source must have an <svg> root element.');
  }

  return svg as unknown as SVGSVGElement;
}

function sanitizeSvg(svg: SVGSVGElement, title?: string): SVGSVGElement {
  svg.querySelectorAll('script').forEach((node) => node.remove());

  for (const element of svg.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  for (const attribute of Array.from(svg.attributes)) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim().toLowerCase();
    if (name.startsWith('on') || value.startsWith('javascript:')) {
      svg.removeAttribute(attribute.name);
    }
  }

  if (!svg.getAttribute('viewBox')) {
    const width = parseFloat(svg.getAttribute('width') || '');
    const height = parseFloat(svg.getAttribute('height') || '');
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
  }

  if (title && !svg.getAttribute('aria-label')) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
  }

  return svg;
}

function renderSvgMarkup(source: SvgSource): string {
  const svg = sanitizeSvg(parseSvg(source), source.title);
  return new XMLSerializer().serializeToString(svg);
}

function validateSvg(source: unknown): AdapterValidation<SvgSource> {
  if (!isSvgSource(source)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createSvgDiagnostic('error', 'svg-invalid-source', 'SVG source must include markup and sourceId.', source)],
    };
  }

  if (!source.markup.trim()) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createSvgDiagnostic('error', 'svg-empty-source', 'SVG source cannot be empty.', source.markup)],
    };
  }

  try {
    renderSvgMarkup(source);
    return { ok: true, source, diagnostics: [] };
  } catch (error) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [createSvgDiagnostic('error', 'svg-parse-error', 'SVG source could not be parsed.', source.markup, error)],
    };
  }
}

function mountSvg({ source, container, context }: { source: SvgSource; container: HTMLElement; context: RendererContext }): SvgInstance {
  const sourceKey = getSvgSourceKey(source);
  const existing = mountedInstances.get(container);
  if (existing?.sourceKey === sourceKey) {
    context.reportDiagnostic(
      createAdapterDiagnostic({
        severity: 'info',
        rendererId: SVG_ADAPTER_ID,
        code: 'svg-duplicate-mount-skipped',
        message: 'SVG mount skipped because this source is already rendered in the container.',
        lessonId: context.lessonId,
        sectionId: context.sectionId,
        blockId: context.blockId,
        sourceExcerpt: getSourceExcerpt(source.markup),
      }),
    );
    return existing;
  }

  const renderedMarkup = renderSvgMarkup(source);
  container.innerHTML = renderedMarkup;
  container.dataset.rendererAdapter = SVG_ADAPTER_ID;
  container.dataset.rendererSourceId = source.sourceId;
  container.dataset.rendererSourceKey = sourceKey;
  container.dataset.svgSource = source.markup;

  const instance: SvgInstance = { adapterId: SVG_ADAPTER_ID, source, sourceKey, renderedMarkup };
  mountedInstances.set(container, instance);
  return instance;
}

function updateSvg({
  source,
  instance,
  container,
  context,
}: {
  source: SvgSource;
  instance: SvgInstance;
  container: HTMLElement;
  context: RendererContext;
}): SvgInstance {
  if (instance.sourceKey === getSvgSourceKey(source)) return instance;
  unmountSvg({ instance, container, context });
  return mountSvg({ source, container, context });
}

function exportSvg({ source, target }: { source: SvgSource; instance: SvgInstance | null; target: ExportTarget; context: RendererContext }) {
  if (target.kind === 'json') return source;
  return source;
}

function unmountSvg({ instance, container }: { instance: SvgInstance; container: HTMLElement; context: RendererContext }): void {
  if (mountedInstances.get(container) !== instance) return;
  container.innerHTML = '';
  delete container.dataset.rendererAdapter;
  delete container.dataset.rendererSourceId;
  delete container.dataset.rendererSourceKey;
  delete container.dataset.svgSource;
  mountedInstances.delete(container);
}

export const svgAdapter = {
  id: SVG_ADAPTER_ID,
  displayName: 'SVG',
  validate: validateSvg,
  mount: mountSvg,
  update: updateSvg,
  export: exportSvg,
  unmount: unmountSvg,
} satisfies RendererAdapter<SvgSource, SvgInstance, SvgSource>;
