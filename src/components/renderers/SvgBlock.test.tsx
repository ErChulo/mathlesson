import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SvgBlock } from './SvgBlock';

describe('SvgBlock', () => {
  it('mounts rendered SVG while preserving source markup on the host', async () => {
    const markup = '<svg width="100" height="100"><rect width="80" height="80"/></svg>';
    const { container } = render(
      <SvgBlock lessonId="demo" sectionId="math-renderers" source={{ sourceId: 'test-svg', markup, title: 'Test SVG' }} />,
    );

    await waitFor(() => expect(container.querySelector('svg[viewBox="0 0 100 100"]')).toBeInTheDocument());
    expect(container.querySelector('[data-source-id="test-svg"]')).toHaveAttribute('data-source-svg', markup);
  });

  it('rerenders when the SVG source changes', async () => {
    const { container, rerender } = render(
      <SvgBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-svg', markup: '<svg viewBox="0 0 20 20"><rect width="10" height="10"/></svg>' }}
      />,
    );

    await waitFor(() => expect(container.querySelector('rect')).toBeInTheDocument());

    rerender(
      <SvgBlock
        lessonId="demo"
        sectionId="math-renderers"
        source={{ sourceId: 'test-svg', markup: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>' }}
      />,
    );

    await waitFor(() => expect(container.querySelector('circle')).toBeInTheDocument());
  });

  it('renders a diagnostic and preserves source for invalid SVG', async () => {
    const { container } = render(
      <SvgBlock lessonId="demo" sectionId="math-renderers" source={{ sourceId: 'broken-svg', markup: '<div>nope</div>' }} />,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('SVG source could not be parsed.');
    expect(container.querySelector('[data-source-id="broken-svg"]')).toHaveAttribute('data-source-svg', '<div>nope</div>');
  });
});
