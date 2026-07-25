import { describe, expect, it } from 'vitest';
import type { AdapterDiagnostic, RendererContext } from '../core/types';
import {
  createMermaidAdapter,
  getMermaidSourceKey,
  type MermaidRenderResult,
  type MermaidRenderer,
  type MermaidSource,
} from './mermaidAdapter';

function createRenderer(overrides: Partial<MermaidRenderer> = {}) {
  const calls: { initialize: Record<string, unknown>[]; render: Array<{ id: string; source: string }> } = {
    initialize: [],
    render: [],
  };
  const renderer: MermaidRenderer = {
    initialize: (config) => calls.initialize.push(config),
    render: (id, source): MermaidRenderResult => {
      calls.render.push({ id, source });
      return {
        svg: `<svg data-render-id="${id}" data-source-length="${source.length}"><script>bad()</script><g onclick="bad()"><text>Rendered</text></g></svg>`,
      };
    },
    ...overrides,
  };
  return { calls, renderer };
}

function createContext(diagnostics: AdapterDiagnostic[] = [], isVisible = true): RendererContext {
  return {
    lessonId: 'test-lesson',
    sectionId: 'test-section',
    blockId: 'test-block',
    rendererId: 'mermaid',
    phase: 'app',
    theme: 'dark',
    reducedMotion: false,
    isMobile: false,
    isVisible,
    containerSize: { width: 480, height: 240 },
    reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    scheduleAfterVisible: (callback) => callback(),
  };
}

const flowchartSource: MermaidSource = {
  sourceId: 'flowchart-source',
  diagramId: 'flowchart-source',
  source: 'flowchart LR\n  A --> B',
  theme: 'dark',
};

describe('mermaidAdapter', () => {
  it('returns the expected validation result shape for valid source', () => {
    const adapter = createMermaidAdapter(createRenderer().renderer);

    expect(adapter.validate(flowchartSource)).toEqual({ ok: true, source: flowchartSource, diagnostics: [] });
  });

  it('renders valid Mermaid source and sanitizes generated SVG', async () => {
    const { calls, renderer } = createRenderer();
    const adapter = createMermaidAdapter(renderer);
    const container = document.createElement('div');
    const instance = await adapter.mount({ source: flowchartSource, container, context: createContext() });

    expect(calls.initialize[0]).toMatchObject({ startOnLoad: false, securityLevel: 'loose' });
    expect(calls.render).toEqual([{ id: flowchartSource.diagramId, source: flowchartSource.source }]);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('onclick');
    expect(container.dataset.mermaidSource).toBe(flowchartSource.source);
    expect(instance.source).toBe(flowchartSource);
  });

  it('reports invalid diagram source through validation diagnostics', () => {
    const adapter = createMermaidAdapter(createRenderer().renderer);
    const validation = adapter.validate({ ...flowchartSource, source: 'not a diagram' });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics[0]).toMatchObject({
      rendererId: 'mermaid',
      severity: 'error',
      code: 'mermaid-unknown-diagram',
    });
  });

  it('reports render errors without losing source text', async () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const adapter = createMermaidAdapter({
      initialize: () => undefined,
      render: () => Promise.reject(new Error('render failed')),
    });
    const container = document.createElement('div');

    await expect(adapter.mount({ source: flowchartSource, container, context: createContext(diagnostics) })).rejects.toThrow(
      'render failed',
    );

    expect(container.textContent).toBe(flowchartSource.source);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'mermaid-render-error' }));
  });

  it('rerenders when source changes', async () => {
    const adapter = createMermaidAdapter(createRenderer().renderer);
    const container = document.createElement('div');
    const context = createContext();
    const instance = await adapter.mount({ source: flowchartSource, container, context });
    const nextSource = { ...flowchartSource, source: 'flowchart LR\n  A --> C' };

    const nextInstance = await adapter.update?.({ source: nextSource, instance, container, context });

    expect(nextInstance?.source).toEqual(nextSource);
    expect(container.dataset.rendererSourceKey).toBe(getMermaidSourceKey(nextSource));
  });

  it('cleans up generated SVG on unmount', async () => {
    const adapter = createMermaidAdapter(createRenderer().renderer);
    const container = document.createElement('div');
    const context = createContext();
    const instance = await adapter.mount({ source: flowchartSource, container, context });

    adapter.unmount({ instance, container, context });

    expect(container.innerHTML).toBe('');
    expect(container.dataset.rendererAdapter).toBeUndefined();
    expect(container.dataset.mermaidSource).toBeUndefined();
  });

  it('preserves canonical source for export', () => {
    const adapter = createMermaidAdapter(createRenderer().renderer);
    const exported = adapter.export?.({
      source: flowchartSource,
      instance: null,
      target: { kind: 'json' },
      context: createContext(),
    });

    expect(exported).toBe(flowchartSource);
  });

  it('skips duplicate initialization for unchanged source', async () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const { calls, renderer } = createRenderer();
    const adapter = createMermaidAdapter(renderer);
    const container = document.createElement('div');
    const context = createContext(diagnostics);
    const firstInstance = await adapter.mount({ source: flowchartSource, container, context });
    const secondInstance = await adapter.mount({ source: flowchartSource, container, context });

    expect(secondInstance).toBe(firstInstance);
    expect(calls.render).toHaveLength(1);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'mermaid-duplicate-mount-skipped' }));
  });

  it('reports hidden-container risk', async () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const adapter = createMermaidAdapter(createRenderer().renderer);

    await adapter.mount({ source: flowchartSource, container: document.createElement('div'), context: createContext(diagnostics, false) });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'mermaid-hidden-container' }));
  });
});
