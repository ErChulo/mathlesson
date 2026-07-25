import { useEffect, useRef, useState } from 'react';
import { createLifecycleInstance, hasSameLifecycleSource, type RendererLifecycleInstance } from '../../renderers/core/lifecycle';
import type { AdapterDiagnostic, RendererContext } from '../../renderers/core/types';
import { getSvgSourceKey, svgAdapter, type SvgInstance, type SvgSource } from '../../renderers/svg/svgAdapter';

type SvgBlockProps = {
  source: SvgSource;
  lessonId: string;
  sectionId: string;
};

export function SvgBlock({ source, lessonId, sectionId }: SvgBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lifecycleRef = useRef<RendererLifecycleInstance<SvgInstance> | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdapterDiagnostic[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const sourceKey = getSvgSourceKey(source);
    const currentLifecycle = lifecycleRef.current;
    if (hasSameLifecycleSource(currentLifecycle, svgAdapter.id, sourceKey)) return undefined;

    const nextDiagnostics: AdapterDiagnostic[] = [];
    const context = createSvgContext({
      blockId: source.sourceId,
      container,
      lessonId,
      reportDiagnostic: (diagnostic) => nextDiagnostics.push(diagnostic),
      sectionId,
    });
    const validation = svgAdapter.validate(source);

    if (currentLifecycle) {
      svgAdapter.unmount({ instance: currentLifecycle.instance, container, context });
      lifecycleRef.current = null;
    }

    if (!validation.ok) {
      container.textContent = source.markup;
      container.dataset.rendererAdapter = svgAdapter.id;
      container.dataset.rendererSourceId = source.sourceId;
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return undefined;
    }

    const instance = svgAdapter.mount({ source: validation.source, container, context });
    lifecycleRef.current = createLifecycleInstance(svgAdapter.id, sourceKey, instance);
    setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);

    return () => {
      if (!lifecycleRef.current) return;
      svgAdapter.unmount({ instance: lifecycleRef.current.instance, container, context });
      lifecycleRef.current = null;
    };
  }, [lessonId, sectionId, source]);

  return (
    <figure className="svg-block" data-source-id={source.sourceId} data-source-svg={source.markup}>
      <div ref={containerRef} aria-label={source.title || 'Rendered SVG diagram'} />
      {diagnostics.length ? (
        <figcaption className="renderer-diagnostic" role="status">
          {diagnostics[0].message}
        </figcaption>
      ) : null}
    </figure>
  );
}

function createSvgContext({
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
    rendererId: svgAdapter.id,
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
