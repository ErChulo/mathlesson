import { describe, expect, it } from 'vitest';
import type { AdapterDiagnostic, RendererContext } from '../core/types';
import { katexAdapter, type KaTeXSource } from './katexAdapter';

function createContext(diagnostics: AdapterDiagnostic[] = []): RendererContext {
  return {
    lessonId: 'test-lesson',
    sectionId: 'test-section',
    blockId: 'test-block',
    rendererId: katexAdapter.id,
    phase: 'app',
    theme: 'dark',
    reducedMotion: false,
    isMobile: false,
    isVisible: true,
    containerSize: { width: 480, height: 120 },
    reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    scheduleAfterVisible: (callback) => callback(),
  };
}

const blockSource: KaTeXSource = {
  sourceId: 'block-source',
  tex: 'E = mc^2',
  displayMode: true,
};

const inlineSource: KaTeXSource = {
  sourceId: 'inline-source',
  tex: 'a^2 + b^2 = c^2',
  displayMode: false,
};

describe('katexAdapter', () => {
  it('returns the expected validation result shape for valid source', () => {
    const validation = katexAdapter.validate(blockSource);

    expect(validation).toEqual({ ok: true, source: blockSource, diagnostics: [] });
  });

  it('renders valid block math', () => {
    const container = document.createElement('div');
    const instance = katexAdapter.mount({ source: blockSource, container, context: createContext() });

    expect(container.querySelector('.katex-display')).not.toBeNull();
    expect(container.dataset.rendererAdapter).toBe('katex');
    expect(instance.source).toBe(blockSource);
  });

  it('renders valid inline math', () => {
    const container = document.createElement('div');

    katexAdapter.mount({ source: inlineSource, container, context: createContext() });

    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.querySelector('.katex-display')).toBeNull();
  });

  it('reports invalid TeX through validation diagnostics without throwing', () => {
    const validation = katexAdapter.validate({ ...inlineSource, tex: '\\def' });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics[0]).toMatchObject({
      rendererId: 'katex',
      severity: 'error',
      code: 'katex-render-error',
    });
  });

  it('rerenders when source changes', () => {
    const container = document.createElement('div');
    const context = createContext();
    const instance = katexAdapter.mount({ source: inlineSource, container, context });
    const nextSource = { ...inlineSource, tex: 'x + y' };

    const nextInstance = katexAdapter.update?.({ source: nextSource, instance, container, context });

    expect(nextInstance?.source).toEqual(nextSource);
    expect(container.textContent).toContain('x');
    expect(container.dataset.rendererSourceId).toBe(nextSource.sourceId);
    expect(container.dataset.rendererSourceKey).toBeUndefined();
  });

  it('cleans up rendered output on unmount', () => {
    const container = document.createElement('div');
    const context = createContext();
    const instance = katexAdapter.mount({ source: blockSource, container, context });

    katexAdapter.unmount({ instance, container, context });

    expect(container.innerHTML).toBe('');
    expect(container.dataset.rendererAdapter).toBeUndefined();
  });

  it('preserves canonical source for export', () => {
    const exported = katexAdapter.export?.({
      source: blockSource,
      instance: null,
      target: { kind: 'json' },
      context: createContext(),
    });

    expect(exported).toBe(blockSource);
  });

  it('skips duplicate initialization for unchanged source', () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');
    const context = createContext(diagnostics);
    const firstInstance = katexAdapter.mount({ source: blockSource, container, context });
    const firstHtml = container.innerHTML;
    const secondInstance = katexAdapter.mount({ source: blockSource, container, context });

    expect(secondInstance).toBe(firstInstance);
    expect(container.innerHTML).toBe(firstHtml);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({ code: 'katex-duplicate-mount-skipped', rendererId: 'katex' }),
    );
  });
});
