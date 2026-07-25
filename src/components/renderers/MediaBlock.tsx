import { useEffect, useRef, useState } from 'react';
import { createLifecycleInstance, type RendererLifecycleInstance } from '../../renderers/core/lifecycle';
import type { AdapterDiagnostic, RendererContext } from '../../renderers/core/types';
import {
  getMediaSourceKey,
  mediaAdapter,
  type MediaInstance,
  type MediaSource,
} from '../../renderers/media/mediaAdapter';

type MediaBlockProps = {
  source: MediaSource;
  lessonId: string;
  sectionId: string;
  adapter?: typeof mediaAdapter;
};

export function MediaBlock({ source, lessonId, sectionId, adapter = mediaAdapter }: MediaBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lifecycleRef = useRef<RendererLifecycleInstance<MediaInstance> | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdapterDiagnostic[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextDiagnostics: AdapterDiagnostic[] = [];
    const context = createMediaContext({
      blockId: source.sourceId,
      container,
      lessonId,
      reportDiagnostic: (diagnostic) => nextDiagnostics.push(diagnostic),
      sectionId,
    });
    const validation = adapter.validate(source);
    const currentLifecycle = lifecycleRef.current;

    if (!validation.ok) {
      if (currentLifecycle) {
        adapter.unmount({ instance: currentLifecycle.instance, container, context });
        lifecycleRef.current = null;
      }

      container.textContent = validation.diagnostics[0]?.message ?? 'Media source could not be rendered.';
      container.dataset.rendererAdapter = adapter.id;
      container.dataset.rendererSourceId = source.sourceId;
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return;
    }

    let instance: MediaInstance;
    if (currentLifecycle?.adapterId === adapter.id) {
      instance = adapter.update
        ? adapter.update({ source: validation.source, instance: currentLifecycle.instance, container, context })
        : adapter.mount({ source: validation.source, container, context });
    } else {
      if (currentLifecycle) adapter.unmount({ instance: currentLifecycle.instance, container, context });
      instance = adapter.mount({ source: validation.source, container, context });
    }

    lifecycleRef.current = createLifecycleInstance(adapter.id, getMediaSourceKey(validation.source), instance);
    setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
  }, [
    adapter,
    lessonId,
    sectionId,
    source.altText,
    source.caption,
    source.dimensions?.height,
    source.dimensions?.width,
    source.kind,
    source.mediaType,
    source.placeholderId,
    source.poster,
    source.sourceId,
    source.transcript,
    source.url,
  ]);

  useEffect(() => {
    return () => {
      const container = containerRef.current;
      const lifecycle = lifecycleRef.current;
      if (!container || !lifecycle) return;

      const context = createMediaContext({
        blockId: lifecycle.instance.source.sourceId,
        container,
        lessonId,
        reportDiagnostic: () => undefined,
        sectionId,
      });
      adapter.unmount({ instance: lifecycle.instance, container, context });
      lifecycleRef.current = null;
    };
  }, [adapter, lessonId, sectionId]);

  return (
    <figure className="media-block" data-source-id={source.sourceId}>
      <div ref={containerRef} className="media-frame" aria-label={source.altText || source.caption || 'Media block'} />
      {source.caption ? <figcaption className="media-caption">{source.caption}</figcaption> : null}
      {source.transcript ? (
        <details className="media-transcript">
          <summary>Transcript</summary>
          <p>{source.transcript}</p>
        </details>
      ) : null}
      {diagnostics.length ? (
        <p className="renderer-diagnostic" role="status">
          {diagnostics[0].message}
        </p>
      ) : null}
    </figure>
  );
}

function createMediaContext({
  blockId,
  container,
  lessonId,
  reportDiagnostic,
  sectionId,
}: {
  blockId: string;
  container: HTMLElement;
  lessonId: string;
  reportDiagnostic: (diagnostic: AdapterDiagnostic) => void;
  sectionId: string;
}): RendererContext {
  return {
    lessonId,
    sectionId,
    blockId,
    rendererId: mediaAdapter.id,
    phase: 'app',
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    reducedMotion: document.documentElement.dataset.motion === 'reduced',
    isMobile: window.matchMedia?.('(max-width: 780px)').matches ?? false,
    isVisible: true,
    containerSize: {
      width: container.clientWidth,
      height: container.clientHeight,
    },
    reportDiagnostic,
    scheduleAfterVisible: (callback) => callback(),
  };
}
