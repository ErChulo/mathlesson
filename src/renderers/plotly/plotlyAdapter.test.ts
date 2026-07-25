import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdapterDiagnostic, RendererContext } from '../core/types';
import {
  createPlotlyAdapter,
  createPlotlyThemeRelayout,
  getPlotlySourceKey,
  type PlotlyRenderer,
  type PlotlySource,
} from './plotlyAdapter';

function createContext(
  diagnostics: AdapterDiagnostic[] = [],
  overrides: Partial<Pick<RendererContext, 'containerSize' | 'isVisible' | 'scheduleAfterVisible' | 'theme'>> = {},
): RendererContext {
  return {
    lessonId: 'test-lesson',
    sectionId: 'test-section',
    blockId: 'test-plot',
    rendererId: 'plotly',
    phase: 'app',
    theme: overrides.theme ?? 'dark',
    reducedMotion: false,
    isMobile: false,
    isVisible: overrides.isVisible ?? true,
    containerSize: overrides.containerSize ?? { width: 640, height: 360 },
    reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    scheduleAfterVisible: overrides.scheduleAfterVisible ?? ((callback) => callback()),
  };
}

function createFakeRenderer(): PlotlyRenderer {
  return {
    newPlot: vi.fn(() => undefined),
    react: vi.fn(() => undefined),
    relayout: vi.fn(() => undefined),
    purge: vi.fn(() => undefined),
    Plots: {
      resize: vi.fn(() => undefined),
    },
  };
}

const plotlySource: PlotlySource = {
  sourceId: 'plotly-source',
  plotId: 'phase-2-plotly-demo',
  title: 'Line chart',
  height: 320,
  data: [{ x: [0, 1, 2], y: [0, 1, 4], mode: 'lines+markers', type: 'scatter' }],
  layout: { xaxis: { title: 'x' }, yaxis: { title: 'y' } },
  config: { displayModeBar: false },
};

describe('plotlyAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the expected validation result shape for valid structured source', () => {
    const adapter = createPlotlyAdapter(createFakeRenderer());

    expect(adapter.validate(plotlySource)).toEqual({ ok: true, source: plotlySource, diagnostics: [] });
  });

  it('reports invalid trace roots through validation diagnostics', () => {
    const adapter = createPlotlyAdapter(createFakeRenderer());
    const validation = adapter.validate({ ...plotlySource, data: 'not traces' });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics[0]).toMatchObject({ rendererId: 'plotly', severity: 'error', code: 'plotly-invalid-source' });
  });

  it('mounts visible containers with newPlot, baseline config, metadata, and source preservation', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const container = document.createElement('div');

    const instance = await adapter.mount({ source: plotlySource, container, context: createContext() });

    expect(renderer.newPlot).toHaveBeenCalledWith(
      container,
      plotlySource.data,
      expect.objectContaining({ height: 320, paper_bgcolor: 'rgba(0,0,0,0)' }),
      expect.objectContaining({ displayModeBar: false, responsive: true }),
    );
    expect(container.dataset.rendererAdapter).toBe('plotly');
    expect(container.dataset.plotlyPlotId).toBe(plotlySource.plotId);
    expect(container.dataset.plotlySource).toBe(getPlotlySourceKey(plotlySource));
    expect(container.style.minHeight).toBe('320px');
    expect(instance.mounted).toBe(true);
  });

  it('defers hidden or zero-width containers until the visibility scheduler runs', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const diagnostics: AdapterDiagnostic[] = [];
    let afterVisible: (() => void) | undefined;
    const container = document.createElement('div');

    const instance = await adapter.mount({
      source: plotlySource,
      container,
      context: createContext(diagnostics, {
        isVisible: false,
        containerSize: { width: 0, height: 0 },
        scheduleAfterVisible: (callback) => {
          afterVisible = callback;
        },
      }),
    });

    expect(instance.mounted).toBe(false);
    expect(renderer.newPlot).not.toHaveBeenCalled();
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'plotly-hidden-container' }));

    afterVisible?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(renderer.newPlot).toHaveBeenCalledTimes(1);
  });

  it('updates mounted plots with react without replacing the container', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const container = document.createElement('div');
    const context = createContext();
    const instance = await adapter.mount({ source: plotlySource, container, context });
    const nextSource = { ...plotlySource, data: [{ x: [0, 1], y: [2, 3], type: 'bar' }] };

    const nextInstance = await adapter.update?.({ source: nextSource, instance, container, context });

    expect(nextInstance).toBe(instance);
    expect(renderer.react).toHaveBeenCalledWith(container, nextSource.data, expect.any(Object), expect.any(Object));
    expect(container.dataset.plotlySource).toBe(getPlotlySourceKey(nextSource));
  });

  it('resizes and applies theme relayout to mounted plots', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const container = document.createElement('div');
    const instance = await adapter.mount({ source: plotlySource, container, context: createContext() });

    adapter.resize?.({ instance, container, context: createContext([], { theme: 'light' }) });

    expect(renderer.relayout).toHaveBeenCalledWith(container, createPlotlyThemeRelayout('light'));
    expect(renderer.Plots.resize).toHaveBeenCalledWith(container);
  });

  it('skips duplicate initialization for unchanged source', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');
    const context = createContext(diagnostics);
    const firstInstance = await adapter.mount({ source: plotlySource, container, context });
    const secondInstance = await adapter.mount({ source: plotlySource, container, context });

    expect(secondInstance).toBe(firstInstance);
    expect(renderer.newPlot).toHaveBeenCalledTimes(1);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'plotly-duplicate-mount-skipped' }));
  });

  it('cleans up Plotly instances with purge on unmount', async () => {
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const container = document.createElement('div');
    const context = createContext();
    const instance = await adapter.mount({ source: plotlySource, container, context });

    adapter.unmount({ instance, container, context });

    expect(renderer.purge).toHaveBeenCalledWith(container);
    expect(container.innerHTML).toBe('');
    expect(container.dataset.rendererAdapter).toBeUndefined();
    expect(container.dataset.plotlySource).toBeUndefined();
  });

  it('preserves canonical source for export', () => {
    const adapter = createPlotlyAdapter(createFakeRenderer());
    const exported = adapter.export?.({ source: plotlySource, instance: null, target: { kind: 'json' }, context: createContext() });

    expect(exported).toBe(plotlySource);
  });

  it('reports render errors and leaves an accessible fallback message', async () => {
    const renderer = createFakeRenderer();
    vi.mocked(renderer.newPlot).mockImplementation(() => {
      throw new Error('boom');
    });
    const adapter = createPlotlyAdapter(renderer);
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');

    await expect(adapter.mount({ source: plotlySource, container, context: createContext(diagnostics) })).rejects.toThrow('boom');

    expect(container).toHaveTextContent('Plotly could not render this source.');
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'plotly-render-error' }));
  });
});
