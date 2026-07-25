import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KaTeXBlock } from './KaTeXBlock';

describe('KaTeXBlock', () => {
  it('mounts rendered KaTeX without exposing raw TeX on the initial host', async () => {
    const { container } = render(
      <KaTeXBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-katex', tex: 'E = mc^2', displayMode: true }}
      />,
    );

    await waitFor(() => expect(container.querySelector('.katex-display')).toBeInTheDocument());
    expect(container.querySelector('[data-source-id="test-katex"]')).not.toHaveAttribute('data-source-tex');
  });

  it('rerenders when the source changes', async () => {
    const { container, rerender } = render(
      <KaTeXBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-katex', tex: 'x', displayMode: false }}
      />,
    );

    await waitFor(() => expect(container.querySelector('.katex')).toBeInTheDocument());

    rerender(
      <KaTeXBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-katex', tex: 'y', displayMode: false }}
      />,
    );

    await waitFor(() => expect(container.textContent).toContain('y'));
  });

  it('renders a safe fallback diagnostic without exposing invalid TeX on the DOM host', async () => {
    const { container } = render(
      <KaTeXBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'broken-katex', tex: '\\notACommand{raw-secret}', displayMode: true }}
      />,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('KaTeX could not render this source.');
    expect(container.querySelector('[data-source-id="broken-katex"]')).not.toHaveAttribute('data-source-tex');
    expect(container.querySelector('[aria-label="Rendered mathematical expression"]')).toHaveTextContent(
      'Math expression could not be rendered.',
    );
    expect(container).not.toHaveTextContent('raw-secret');
  });
});
