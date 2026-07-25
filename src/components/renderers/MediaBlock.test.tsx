import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MediaSource } from '../../renderers/media/mediaAdapter';
import { MediaBlock } from './MediaBlock';

describe('MediaBlock', () => {
  it('mounts an explicit media placeholder without exposing source metadata on the DOM host', async () => {
    const source: MediaSource = {
      sourceId: 'test-media-placeholder',
      kind: 'video-placeholder',
      placeholderId: 'manim-placeholder',
      caption: 'Deferred animation',
      altText: 'Placeholder for a Manim animation',
    };
    const { container } = render(<MediaBlock lessonId="demo" sectionId="math-renderers" source={source} />);

    await waitFor(() => expect(screen.getByText('Media placeholder: manim-placeholder')).toBeInTheDocument());
    expect(container.querySelector('[data-source-id="test-media-placeholder"]')).not.toHaveAttribute('data-source-media');
  });

  it('renders missing media as a non-blocking diagnostic fallback', async () => {
    const source: MediaSource = { sourceId: 'missing-media', kind: 'video' };
    const { container } = render(<MediaBlock lessonId="demo" sectionId="math-renderers" source={source} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Media source is missing a URL or placeholder id');
    expect(container.querySelector('.media-placeholder')).toHaveTextContent('Video source is missing');
    expect(container.querySelector('[data-source-id="missing-media"]')).not.toHaveAttribute('data-source-media');
  });

  it('renders a validation diagnostic and preserves invalid source metadata', async () => {
    const source = {
      sourceId: 'invalid-media',
      kind: 'video',
      url: 'scene.html',
      mediaType: 'text/html',
    } as unknown as MediaSource;
    const { container } = render(<MediaBlock lessonId="demo" sectionId="math-renderers" source={source} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Media type must be an allowed video MIME type.');
    expect(container.querySelector('[data-source-id="invalid-media"]')).not.toHaveAttribute('data-source-media');
  });
});
