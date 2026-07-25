import 'katex/dist/katex.min.css';
import { useEffect, useRef, useState } from 'react';
import { createLifecycleInstance, hasSameLifecycleSource, type RendererLifecycleInstance } from '../../renderers/core/lifecycle';
import type { AdapterDiagnostic, RendererContext } from '../../renderers/core/types';
import { getKaTeXSourceKey, katexAdapter, type KaTeXInstance, type KaTeXSource } from '../../renderers/katex/katexAdapter';

type KaTeXBlockProps = {
  source: KaTeXSource;
  lessonId: string;
  sectionId: string;
};

export function KaTeXBlock({ source, lessonId, sectionId }: KaTeXBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lifecycleRef = useRef<RendererLifecycleInstance<KaTeXInstance> | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdapterDiagnostic[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const sourceKey = getKaTeXSourceKey(source);
    const currentLifecycle = lifecycleRef.current;
    if (hasSameLifecycleSource(currentLifecycle, katexAdapter.id, sourceKey)) return undefined;

    const nextDiagnostics: AdapterDiagnostic[] = [];
    const context = createKaTeXContext({
      blockId: source.sourceId,
      container,
      lessonId,
      reportDiagnostic: (diagnostic) => nextDiagnostics.push(diagnostic),
      sectionId,
    });
    const validation = katexAdapter.validate(source);

    if (currentLifecycle) {
      katexAdapter.unmount({ instance: currentLifecycle.instance, container, context });
      lifecycleRef.current = null;
    }

    if (!validation.ok) {
      container.textContent = source.tex;
      container.dataset.rendererAdapter = katexAdapter.id;
      container.dataset.rendererSourceId = source.sourceId;
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return undefined;
    }

    const instance = katexAdapter.mount({ source: validation.source, container, context });
    lifecycleRef.current = createLifecycleInstance(katexAdapter.id, sourceKey, instance);
    setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);

    return () => {
      if (!lifecycleRef.current) return;
      katexAdapter.unmount({ instance: lifecycleRef.current.instance, container, context });
      lifecycleRef.current = null;
    };
  }, [lessonId, sectionId, source]);

  const className = source.displayMode ? 'katex-block display' : 'katex-block inline';

  return (
    <figure className={className} data-source-tex={source.tex} data-source-id={source.sourceId}>
      <div ref={containerRef} aria-label="Rendered mathematical expression" />
      {diagnostics.length ? (
        <figcaption className="renderer-diagnostic" role="status">
          {diagnostics[0].message}
        </figcaption>
      ) : null}
    </figure>
  );
}

function createKaTeXContext({
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
    rendererId: katexAdapter.id,
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
