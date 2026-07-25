import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMermaidAdapter, type MermaidRenderer } from '../../renderers/mermaid/mermaidAdapter';
import { MermaidBlock } from './MermaidBlock';

function createTestAdapter() {
  const renderer: MermaidRenderer = {
    initialize: () => undefined,
    render: (id, source) => ({ svg: `<svg data-render-id="${id}" data-render-length="${source.length}"></svg>` }),
  };
  return createMermaidAdapter(renderer);
}

describe('MermaidBlock', () => {
  it('mounts rendered Mermaid output without exposing raw source on the DOM host', async () => {
    const { container } = render(
      <MermaidBlock
        adapter={createTestAdapter()}
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-mermaid', diagramId: 'test-mermaid', source: 'flowchart LR\n  A --> B' }}
        theme="dark"
      />,
    );

    await waitFor(() => expect(container.querySelector('svg[data-render-id="test-mermaid"]')).toBeInTheDocument());
    expect(container.querySelector('[data-source-id="test-mermaid"]')).not.toHaveAttribute('data-source-mermaid');
  });

  it('rerenders when source changes', async () => {
    const adapter = createTestAdapter();
    const firstSource = 'flowchart LR\n  A --> B';
    const nextSource = 'flowchart LR\n  A --> C --> D';
    const { container, rerender } = render(
      <MermaidBlock
        adapter={adapter}
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-mermaid', diagramId: 'test-mermaid', source: firstSource }}
        theme="dark"
      />,
    );

    await waitFor(() =>
      expect(container.querySelector(`svg[data-render-length="${firstSource.length}"]`)).toBeInTheDocument(),
    );

    rerender(
      <MermaidBlock
        adapter={adapter}
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-mermaid', diagramId: 'test-mermaid', source: nextSource }}
        theme="dark"
      />,
    );

    await waitFor(() =>
      expect(container.querySelector(`svg[data-render-length="${nextSource.length}"]`)).toBeInTheDocument(),
    );
  });

  it('renders a safe fallback diagnostic without exposing invalid Mermaid source on the DOM host', async () => {
    const { container } = render(
      <MermaidBlock
        adapter={createTestAdapter()}
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'broken-mermaid', diagramId: 'broken-mermaid', source: 'not a diagram raw-secret' }}
        theme="dark"
      />,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Mermaid source must start with a known diagram type.');
    expect(container.querySelector('[data-source-id="broken-mermaid"]')).not.toHaveAttribute('data-source-mermaid');
    expect(container.querySelector('[aria-label="Rendered Mermaid diagram"]')).toHaveTextContent(
      'Mermaid diagram could not be rendered.',
    );
    expect(container).not.toHaveTextContent('raw-secret');
  });
});
