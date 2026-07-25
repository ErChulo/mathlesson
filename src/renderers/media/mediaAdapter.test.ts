import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdapterDiagnostic, RendererContext } from '../core/types';
import { mediaAdapter, type MediaSource } from './mediaAdapter';

function createContext(
  diagnostics: AdapterDiagnostic[] = [],
  overrides: Partial<Pick<RendererContext, 'isVisible' | 'scheduleAfterVisible'>> = {},
): RendererContext {
  return {
    lessonId: 'test-lesson',
    sectionId: 'test-section',
    blockId: 'test-block',
    rendererId: mediaAdapter.id,
    phase: 'app',
    theme: 'dark',
    reducedMotion: false,
    isMobile: false,
    isVisible: overrides.isVisible ?? true,
    containerSize: { width: 640, height: 360 },
    reportDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    scheduleAfterVisible: overrides.scheduleAfterVisible ?? ((callback) => callback()),
  };
}

const videoSource: MediaSource = {
  sourceId: 'video-source',
  kind: 'video',
  url: 'scene.mp4',
  mediaType: 'video/mp4',
  caption: 'Manim scene',
  altText: 'A Manim animation scene',
  dimensions: { width: 16, height: 9 },
};

describe('mediaAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the expected validation result shape for valid video source', () => {
    expect(mediaAdapter.validate(videoSource)).toEqual({ ok: true, source: videoSource, diagnostics: [] });
  });

  it('mounts a native video with baseline controls, preload, playsinline, and source preservation', () => {
    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const container = document.createElement('div');
    const instance = mediaAdapter.mount({ source: videoSource, container, context: createContext() });
    const video = container.querySelector('video');

    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('aria-label', 'A Manim animation scene');
    expect(video?.querySelector('source')).toHaveAttribute('src', 'scene.mp4');
    expect(video?.querySelector('source')).toHaveAttribute('type', 'video/mp4');
    expect(container.dataset.mediaSource).toBeUndefined();
    expect(container.dataset.mediaIdentityKey).toBeUndefined();
    expect(container.style.aspectRatio).toBe('16 / 9');
    expect(instance.source).toBe(videoSource);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('renders an explicit placeholder when the video asset is deferred', () => {
    const source: MediaSource = {
      sourceId: 'placeholder-source',
      kind: 'video-placeholder',
      placeholderId: 'manim-intro-scene',
      caption: 'Deferred Manim scene',
    };
    const container = document.createElement('div');

    mediaAdapter.mount({ source, container, context: createContext() });

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('.media-placeholder')).toHaveTextContent('Media placeholder: manim-intro-scene');
    expect(container.dataset.mediaSource).toBeUndefined();
  });

  it('reports missing media as a non-fatal validation diagnostic', () => {
    const source: MediaSource = { sourceId: 'missing-media', kind: 'video' };
    const validation = mediaAdapter.validate(source);

    expect(validation.ok).toBe(true);
    expect(validation.diagnostics[0]).toMatchObject({
      rendererId: 'media',
      severity: 'warning',
      code: 'media-missing-source',
    });
  });

  it('rejects unsupported media types', () => {
    const validation = mediaAdapter.validate({ ...videoSource, mediaType: 'text/html' });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics.at(-1)).toMatchObject({ rendererId: 'media', severity: 'error', code: 'media-invalid-type' });
  });

  it('rejects invalid dimensions', () => {
    const validation = mediaAdapter.validate({ ...videoSource, dimensions: { width: 0, height: 9 } });

    expect(validation.ok).toBe(false);
    expect(validation.diagnostics.at(-1)).toMatchObject({ code: 'media-invalid-dimensions' });
  });

  it('appends a safe load note and diagnostic when the video emits an error', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');
    const source = { ...videoSource, url: 'private/raw-secret-scene.mp4' };

    mediaAdapter.mount({ source, container, context: createContext(diagnostics) });
    container.querySelector('video')?.dispatchEvent(new Event('error'));

    expect(container.querySelector('.video-load-note')).toHaveTextContent('Video could not load.');
    expect(container.querySelector('.video-load-note')).not.toHaveTextContent('raw-secret');
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'media-load-error' }));
  });

  it('defers video loading when the container is hidden', () => {
    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const diagnostics: AdapterDiagnostic[] = [];
    let afterVisible: (() => void) | undefined;
    const container = document.createElement('div');

    mediaAdapter.mount({
      source: videoSource,
      container,
      context: createContext(diagnostics, {
        isVisible: false,
        scheduleAfterVisible: (callback) => {
          afterVisible = callback;
        },
      }),
    });

    expect(container.querySelector('video')).toHaveAttribute('preload', 'none');
    expect(loadSpy).not.toHaveBeenCalled();
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'media-hidden-container' }));

    afterVisible?.();

    expect(container.querySelector('video')).toHaveAttribute('preload', 'metadata');
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('updates same-identity video metadata without replacing the media element', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const container = document.createElement('div');
    const context = createContext();
    const instance = mediaAdapter.mount({ source: videoSource, container, context });
    const video = container.querySelector('video');
    const nextSource = { ...videoSource, caption: 'Updated caption', altText: 'Updated accessible label', poster: 'poster.png' };

    const nextInstance = mediaAdapter.update?.({ source: nextSource, instance, container, context });

    expect(nextInstance).toBe(instance);
    expect(container.querySelector('video')).toBe(video);
    expect(video).toHaveAttribute('poster', 'poster.png');
    expect(video).toHaveAttribute('aria-label', 'Updated accessible label');
    expect(nextInstance?.source).toEqual(nextSource);
    expect(container.dataset.mediaSource).toBeUndefined();
  });

  it('cleans up video state on unmount', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    const container = document.createElement('div');
    const context = createContext();
    const instance = mediaAdapter.mount({ source: videoSource, container, context });

    mediaAdapter.unmount({ instance, container, context });

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe('');
    expect(container.dataset.rendererAdapter).toBeUndefined();
    expect(container.dataset.mediaSource).toBeUndefined();
  });

  it('preserves canonical source for export and duplicate mounts', () => {
    const diagnostics: AdapterDiagnostic[] = [];
    const container = document.createElement('div');
    const context = createContext(diagnostics);
    const firstInstance = mediaAdapter.mount({ source: { ...videoSource, kind: 'video-placeholder', url: undefined }, container, context });
    const secondInstance = mediaAdapter.mount({ source: { ...videoSource, kind: 'video-placeholder', url: undefined }, container, context });
    const exported = mediaAdapter.export?.({ source: videoSource, instance: null, target: { kind: 'json' }, context });

    expect(secondInstance).toBe(firstInstance);
    expect(exported).toBe(videoSource);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'media-duplicate-mount-skipped' }));
  });
});
