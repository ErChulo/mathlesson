import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPlotlyAdapter,
  type PlotlyRenderer,
  type PlotlySource,
} from '../../renderers/plotly/plotlyAdapter';
import { PlotlyBlock } from './PlotlyBlock';

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

const source: PlotlySource = {
  sourceId: 'test-plotly',
  plotId: 'test-plotly-chart',
  title: 'Test Plotly chart',
  height: 280,
  data: [{ x: [0, 1, 2], y: [0, 1, 4], type: 'scatter' }],
};

describe('PlotlyBlock', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts a Plotly chart without exposing source metadata on the DOM host', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const { container } = render(
      <PlotlyBlock adapter={adapter} layoutKey="expanded:false" lessonId="demo" sectionId="plotly-renderer" source={source} theme="dark" />,
    );

    await waitFor(() => expect(renderer.newPlot).toHaveBeenCalledTimes(1));
    expect(container.querySelector('[data-source-id="test-plotly"]')).not.toHaveAttribute('data-source-plotly');
    expect(container.querySelector('.plotly-frame')).toHaveAttribute('data-renderer-adapter', 'plotly');
  });

  it('updates source changes through the adapter update path', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    const renderer = createFakeRenderer();
    const adapter = createPlotlyAdapter(renderer);
    const { rerender } = render(
      <PlotlyBlock adapter={adapter} layoutKey="expanded:false" lessonId="demo" sectionId="plotly-renderer" source={source} theme="dark" />,
    );
    await waitFor(() => expect(renderer.newPlot).toHaveBeenCalledTimes(1));

    const nextSource = { ...source, data: [{ x: [0, 1], y: [2, 3], type: 'bar' }] };
    rerender(
      <PlotlyBlock adapter={adapter} layoutKey="expanded:false" lessonId="demo" sectionId="plotly-renderer" source={nextSource} theme="dark" />,
    );

    await waitFor(() => expect(renderer.react).toHaveBeenCalledTimes(1));
  });

  it('renders validation diagnostics and preserves invalid source metadata', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640);
    const adapter = createPlotlyAdapter(createFakeRenderer());
    const invalidSource = { ...source, data: [] };
    const { container } = render(
      <PlotlyBlock
        adapter={adapter}
        layoutKey="expanded:false"
        lessonId="demo"
        sectionId="plotly-renderer"
        source={invalidSource}
        theme="dark"
      />,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Plotly source must include at least one trace.');
    expect(container.querySelector('[data-source-id="test-plotly"]')).not.toHaveAttribute('data-source-plotly');
  });
});
