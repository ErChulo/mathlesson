import { createAdapterDiagnostic, getSourceExcerpt } from '../core/diagnostics';
import type { AdapterDiagnostic, AdapterValidation, ExportTarget, RendererAdapter, RendererContext } from '../core/types';

const MEDIA_ADAPTER_ID = 'media' as const;

export type MediaKind = 'video' | 'video-placeholder';

export type VideoMediaType = 'video/mp4' | 'video/webm' | 'video/ogg' | 'video/quicktime';

export type MediaDimensions = {
  width: number;
  height: number;
};

export type MediaSource = {
  sourceId: string;
  kind: MediaKind;
  url?: string;
  placeholderId?: string;
  mediaType?: VideoMediaType;
  poster?: string;
  caption?: string;
  altText?: string;
  dimensions?: MediaDimensions;
  transcript?: string;
};

export type MediaInstance = {
  adapterId: 'media';
  source: MediaSource;
  sourceKey: string;
  identityKey: string;
  element: HTMLElement;
  errorHandler?: () => void;
};

const allowedVideoMediaTypes = new Set<VideoMediaType>(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const mountedInstances = new WeakMap<HTMLElement, MediaInstance>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isMediaKind(value: unknown): value is MediaKind {
  return value === 'video' || value === 'video-placeholder';
}

function isMediaSource(value: unknown): value is MediaSource {
  if (!isRecord(value)) return false;

  return (
    typeof value.sourceId === 'string' &&
    isMediaKind(value.kind) &&
    isOptionalString(value.url) &&
    isOptionalString(value.placeholderId) &&
    isOptionalString(value.mediaType) &&
    isOptionalString(value.poster) &&
    isOptionalString(value.caption) &&
    isOptionalString(value.altText) &&
    isOptionalString(value.transcript) &&
    (value.dimensions === undefined || isRecord(value.dimensions))
  );
}

export function serializeMediaSource(source: MediaSource): string {
  return JSON.stringify({
    sourceId: source.sourceId,
    kind: source.kind,
    url: source.url ?? '',
    placeholderId: source.placeholderId ?? '',
    mediaType: source.mediaType ?? '',
    poster: source.poster ?? '',
    caption: source.caption ?? '',
    altText: source.altText ?? '',
    dimensions: source.dimensions ?? null,
    transcript: source.transcript ?? '',
  });
}

export function getMediaSourceKey(source: MediaSource): string {
  return serializeMediaSource(source);
}

export function getMediaIdentityKey(source: MediaSource): string {
  return JSON.stringify({
    kind: source.kind,
    url: source.url?.trim() ?? '',
    placeholderId: source.placeholderId?.trim() ?? '',
    mediaType: source.mediaType ?? '',
  });
}

function sourceExcerpt(source: unknown): string | undefined {
  if (typeof source === 'string') return getSourceExcerpt(source);
  try {
    return getSourceExcerpt(JSON.stringify(source));
  } catch {
    return undefined;
  }
}

function createMediaDiagnostic(
  severity: AdapterDiagnostic['severity'],
  code: string,
  message: string,
  source: unknown,
  cause?: unknown,
  context?: RendererContext,
): AdapterDiagnostic {
  return createAdapterDiagnostic({
    severity,
    rendererId: MEDIA_ADAPTER_ID,
    code,
    message,
    lessonId: context?.lessonId,
    sectionId: context?.sectionId,
    blockId: context?.blockId,
    sourceExcerpt: sourceExcerpt(source),
    cause,
  });
}

function hasVideoUrl(source: MediaSource): boolean {
  return Boolean(source.url?.trim());
}

function hasPlaceholderId(source: MediaSource): boolean {
  return Boolean(source.placeholderId?.trim());
}

function isUnsafeUrl(value: string | undefined): boolean {
  return Boolean(value && /^\s*javascript:/i.test(value));
}

function hasValidDimensions(dimensions: MediaSource['dimensions']): boolean {
  if (!dimensions) return true;
  return Number.isFinite(dimensions.width) && Number.isFinite(dimensions.height) && dimensions.width > 0 && dimensions.height > 0;
}

function validateMedia(source: unknown): AdapterValidation<MediaSource> {
  if (!isMediaSource(source)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        createMediaDiagnostic(
          'error',
          'media-invalid-source',
          'Media source must include sourceId, kind, and optional video metadata.',
          source,
        ),
      ],
    };
  }

  const diagnostics: AdapterDiagnostic[] = [];

  if (!hasVideoUrl(source) && !hasPlaceholderId(source)) {
    diagnostics.push(
      createMediaDiagnostic(
        'warning',
        'media-missing-source',
        'Media source is missing a URL or placeholder id; rendering a non-blocking fallback.',
        source,
      ),
    );
  }

  if (source.mediaType && !allowedVideoMediaTypes.has(source.mediaType)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        ...diagnostics,
        createMediaDiagnostic('error', 'media-invalid-type', 'Media type must be an allowed video MIME type.', source),
      ],
    };
  }

  if (isUnsafeUrl(source.url) || isUnsafeUrl(source.poster)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [...diagnostics, createMediaDiagnostic('error', 'media-unsafe-url', 'Media URLs cannot use javascript:.', source)],
    };
  }

  if (!hasValidDimensions(source.dimensions)) {
    return {
      ok: false,
      fallbackSource: source,
      diagnostics: [
        ...diagnostics,
        createMediaDiagnostic('error', 'media-invalid-dimensions', 'Media dimensions must be positive finite numbers.', source),
      ],
    };
  }

  return { ok: true, source, diagnostics };
}

function applyContainerMetadata(container: HTMLElement, source: MediaSource): void {
  container.dataset.rendererAdapter = MEDIA_ADAPTER_ID;
  container.dataset.rendererSourceId = source.sourceId;
  container.dataset.mediaKind = source.kind;

  if (source.dimensions) {
    container.style.aspectRatio = `${source.dimensions.width} / ${source.dimensions.height}`;
  } else {
    container.style.aspectRatio = '';
  }
}

function getMediaLabel(source: MediaSource): string {
  return source.altText || source.caption || (source.url ? `Video source: ${source.url}` : 'Media placeholder');
}

function applyVideoMetadata(video: HTMLVideoElement, source: MediaSource, isVisible: boolean): void {
  video.controls = true;
  video.preload = isVisible ? 'metadata' : 'none';
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.dataset.mlVideoReady = '1';
  video.title = getMediaLabel(source);
  video.setAttribute('aria-label', getMediaLabel(source));

  if (source.poster) {
    video.setAttribute('poster', source.poster);
  } else {
    video.removeAttribute('poster');
  }

  if (source.dimensions) {
    video.setAttribute('width', String(source.dimensions.width));
    video.setAttribute('height', String(source.dimensions.height));
  } else {
    video.removeAttribute('width');
    video.removeAttribute('height');
  }
}

function replaceVideoSource(video: HTMLVideoElement, source: MediaSource): void {
  video.querySelectorAll('source').forEach((node) => node.remove());
  video.removeAttribute('src');

  const sourceElement = document.createElement('source');
  sourceElement.setAttribute('src', source.url?.trim() ?? '');
  if (source.mediaType) sourceElement.setAttribute('type', source.mediaType);
  video.append(sourceElement);
}

function requestVideoLoad(video: HTMLVideoElement, source: MediaSource, context: RendererContext): void {
  try {
    video.load();
  } catch (error) {
    context.reportDiagnostic(
      createMediaDiagnostic('warning', 'media-load-call-failed', 'Video load() failed; native controls remain available.', source, error, context),
    );
  }
}

function appendLoadNote(container: HTMLElement, source: MediaSource, context: RendererContext): void {
  if (container.querySelector('.video-load-note')) return;
  const note = document.createElement('div');
  note.className = 'video-load-note';
  note.textContent = 'Video could not load. Check filename, extension, capitalization, and folder location.';
  container.append(note);
  context.reportDiagnostic(createMediaDiagnostic('warning', 'media-load-error', 'Video could not load.', source, undefined, context));
}

function createVideoElement(source: MediaSource, container: HTMLElement, context: RendererContext): MediaInstance {
  const sourceKey = getMediaSourceKey(source);
  const identityKey = getMediaIdentityKey(source);
  const video = document.createElement('video');
  const errorHandler = () => appendLoadNote(container, source, context);

  applyVideoMetadata(video, source, context.isVisible);
  replaceVideoSource(video, source);
  video.addEventListener('error', errorHandler);
  container.append(video);

  const instance: MediaInstance = { adapterId: MEDIA_ADAPTER_ID, source, sourceKey, identityKey, element: video, errorHandler };
  mountedInstances.set(container, instance);

  if (context.isVisible) {
    requestVideoLoad(video, source, context);
  } else {
    context.scheduleAfterVisible(() => {
      if (mountedInstances.get(container) !== instance) return;
      video.preload = 'metadata';
      requestVideoLoad(video, source, context);
    });
  }

  return instance;
}

function renderPlaceholder(container: HTMLElement, source: MediaSource): HTMLElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'media-placeholder';
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', getMediaLabel(source));

  if (source.poster) {
    const poster = document.createElement('img');
    poster.setAttribute('src', source.poster);
    poster.setAttribute('alt', source.altText || source.caption || 'Media poster');
    placeholder.append(poster);
  }

  const body = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = source.placeholderId ? `Media placeholder: ${source.placeholderId}` : 'Media unavailable';
  const message = document.createElement('span');
  message.textContent = source.placeholderId
    ? 'Video source is deferred; placeholder metadata is preserved.'
    : 'Video source is missing; navigation can continue with this fallback.';
  body.append(title, message);
  placeholder.append(body);
  container.append(placeholder);

  return placeholder;
}

function mountMedia({ source, container, context }: { source: MediaSource; container: HTMLElement; context: RendererContext }): MediaInstance {
  const sourceKey = getMediaSourceKey(source);
  const identityKey = getMediaIdentityKey(source);
  const existing = mountedInstances.get(container);
  if (existing?.sourceKey === sourceKey) {
    context.reportDiagnostic(
      createAdapterDiagnostic({
        severity: 'info',
        rendererId: MEDIA_ADAPTER_ID,
        code: 'media-duplicate-mount-skipped',
        message: 'Media mount skipped because this source is already rendered in the container.',
        lessonId: context.lessonId,
        sectionId: context.sectionId,
        blockId: context.blockId,
        sourceExcerpt: sourceExcerpt(source),
      }),
    );
    return existing;
  }

  if (!context.isVisible) {
    context.reportDiagnostic(
      createMediaDiagnostic(
        'warning',
        'media-hidden-container',
        'Media container is hidden; video loading is deferred until visible.',
        source,
        undefined,
        context,
      ),
    );
  }

  container.innerHTML = '';
  applyContainerMetadata(container, source);

  if (hasVideoUrl(source)) return createVideoElement(source, container, context);

  const element = renderPlaceholder(container, source);
  const instance: MediaInstance = { adapterId: MEDIA_ADAPTER_ID, source, sourceKey, identityKey, element };
  mountedInstances.set(container, instance);
  return instance;
}

function updateMedia({
  source,
  instance,
  container,
  context,
}: {
  source: MediaSource;
  instance: MediaInstance;
  container: HTMLElement;
  context: RendererContext;
}): MediaInstance {
  const sourceKey = getMediaSourceKey(source);
  if (instance.sourceKey === sourceKey) return instance;

  const identityKey = getMediaIdentityKey(source);
  if (instance.identityKey === identityKey && instance.element instanceof HTMLVideoElement && hasVideoUrl(source)) {
    applyContainerMetadata(container, source);
    applyVideoMetadata(instance.element, source, context.isVisible);
    instance.source = source;
    instance.sourceKey = sourceKey;
    return instance;
  }

  unmountMedia({ instance, container, context });
  return mountMedia({ source, container, context });
}

function exportMedia({ source, target }: { source: MediaSource; instance: MediaInstance | null; target: ExportTarget; context: RendererContext }) {
  if (target.kind === 'json') return source;
  return source;
}

function unmountMedia({ instance, container, context }: { instance: MediaInstance; container: HTMLElement; context: RendererContext }): void {
  if (mountedInstances.get(container) !== instance) return;

  if (instance.element instanceof HTMLVideoElement) {
    if (instance.errorHandler) instance.element.removeEventListener('error', instance.errorHandler);
    try {
      instance.element.pause();
    } catch (error) {
      context.reportDiagnostic(
        createMediaDiagnostic('warning', 'media-pause-failed', 'Video pause() failed during cleanup.', instance.source, error, context),
      );
    }
    instance.element.querySelectorAll('source').forEach((node) => node.removeAttribute('src'));
    instance.element.removeAttribute('src');
  }

  container.innerHTML = '';
  container.style.aspectRatio = '';
  delete container.dataset.rendererAdapter;
  delete container.dataset.rendererSourceId;
  delete container.dataset.mediaKind;
  mountedInstances.delete(container);
}

export const mediaAdapter = {
  id: MEDIA_ADAPTER_ID,
  displayName: 'Media',
  validate: validateMedia,
  mount: mountMedia,
  update: updateMedia,
  export: exportMedia,
  unmount: unmountMedia,
} satisfies RendererAdapter<MediaSource, MediaInstance, MediaSource>;
