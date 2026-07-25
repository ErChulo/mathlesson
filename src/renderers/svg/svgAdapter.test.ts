import { describe, expect, it } from 'vitest';
import type { AdapterDiagnostic, RendererContext } from '../core/types';
import { svgAdapter, type SvgSource } from './svgAdapter';

function createContext(diagnostics: AdapterDiagnostic[] = []): RendererContext {
  return {
    lessonId: 'test-lesson',
    sectionId: 'test-section',
    blockId: 'test-block',
    rendererId: svgAdapter.id,
    phase: 'app',
    theme: 'dark',
    reducedMotion: false,
    isMobile: false,
    isVisible: true,
    containerSize: { width: 240, height: 240 },
    reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    scheduleAfterVisible: (callback) => callback(),
  };
}

const svgSource: SvgSource = {
  sourceId: 'svg-source',
  title: 'Unit square',
  markup: '<svg width="120" height="120"><rect x="20" y="20" width="80" height="80"/></svg>',
};

describe('svgAdapter', () => {
  it('returns the expected validation result shape for valid source', () => {
    expect(svgAdapter.validate(svgSource)).toEqual({ ok: true, source: svgSource, diagnostics: [] });
  });

  it('renders valid SVG and repairs missing viewBox from width and height', () => {
    const container = document.createElement('div');
    const instance = svgAdapter.mount({ source: svgSource, container, context: createContext() });
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');
    expect(svg).toHaveAttribute('aria-label', 'Unit square');
    expect(container.dataset.svgSource).toBeUndefined();
    expect(instance.source).toBe(svgSource);
  });

  it('removes script elements, event attributes, and javascript URLs', () => {
    const container = document.createElement('div');

    svgAdapter.mount({
      source: {
        sourceId: 'unsafe-svg',
        markup:
          '<svg viewBox="0 0 10 10" onclick="bad()"><script>bad()</script><a href="javascript:bad()"><circle onmouseover="bad()" cx="5" cy="5" r="4"/></a></svg>',
      },
      container,
      context: createContext(),
    });

    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('onclick');
    expect(container.innerHTML).not.toContain('onmouseover');
    expect(container.innerHTML).not.toContain('javascript:');
  });

  it('reports invalid SVG through validation diagnostics', () => {
    const validation = svgAdapter.validate({ ...svgSource, markup: '<div>not svg</div>' });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics[0]).toMatchObject({ rendererId: 'svg', severity: 'error', code: 'svg-parse-error' });
  });

  it('rerenders when source changes', () => {
    const container = document.createElement('div');
    const context = createContext();
    const instance = svgAdapter.mount({ source: svgSource, container, context });
    const nextSource = { ...svgSource, markup: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>' };

    const nextInstance = svgAdapter.update?.({ source: nextSource, instance, container, context });

    expect(nextInstance?.source).toEqual(nextSource);
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.dataset.rendererSourceId).toBe(nextSource.sourceId);
    expect(container.dataset.rendererSourceKey).toBeUndefined();
  });

  it('cleans up rendered SVG on unmount', () => {
    const container = document.createElement('div');
    const context = createContext();
    const instance = svgAdapter.mount({ source: svgSource, container, context });

    svgAdapter.unmount({ instance, container, context });

    expect(container.innerHTML).toBe('');
    expect(container.dataset.rendererAdapter).toBeUndefined();
    expect(container.dataset.svgSource).toBeUndefined();
  });

  it('preserves canonical source for export', () => {
    const exported = svgAdapter.export?.({ source: svgSource, instance: null, target: { kind: 'json' }, context: createContext() });

    expect(exported).toBe(svgSource);
  });

  it('skips duplicate initialization for unchanged source', () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');
    const context = createContext(diagnostics);
    const firstInstance = svgAdapter.mount({ source: svgSource, container, context });
    const firstHtml = container.innerHTML;
    const secondInstance = svgAdapter.mount({ source: svgSource, container, context });

    expect(secondInstance).toBe(firstInstance);
    expect(container.innerHTML).toBe(firstHtml);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'svg-duplicate-mount-skipped' }));
  });
});
