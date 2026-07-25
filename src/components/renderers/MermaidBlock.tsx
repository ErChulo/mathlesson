import { useEffect, useRef, useState } from 'react';
import { createLifecycleInstance, hasSameLifecycleSource, type RendererLifecycleInstance } from '../../renderers/core/lifecycle';
import type { AdapterDiagnostic, RendererContext } from '../../renderers/core/types';
import {
  getMermaidSourceKey,
  mermaidAdapter,
  type MermaidInstance,
  type MermaidSource,
} from '../../renderers/mermaid/mermaidAdapter';

type MermaidBlockProps = {
  source: Omit<MermaidSource, 'theme'>;
  lessonId: string;
  sectionId: string;
  theme: MermaidSource['theme'];
  adapter?: typeof mermaidAdapter;
};

export function MermaidBlock({ source, lessonId, sectionId, theme, adapter = mermaidAdapter }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lifecycleRef = useRef<RendererLifecycleInstance<MermaidInstance> | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdapterDiagnostic[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    const adapterSource: MermaidSource = { ...source, theme };
    const sourceKey = getMermaidSourceKey(adapterSource);
    const currentLifecycle = lifecycleRef.current;
    if (hasSameLifecycleSource(currentLifecycle, adapter.id, sourceKey)) return undefined;

    const nextDiagnostics: AdapterDiagnostic[] = [];
    const context = createMermaidContext({
      blockId: adapterSource.sourceId,
      container,
      lessonId,
      reportDiagnostic: (diagnostic) => nextDiagnostics.push(diagnostic),
      sectionId,
      theme,
    });

    const validation = adapter.validate(adapterSource);

    if (currentLifecycle) {
      adapter.unmount({ instance: currentLifecycle.instance, container, context });
      lifecycleRef.current = null;
    }

    if (!validation.ok) {
      container.textContent = adapterSource.source;
      container.dataset.rendererAdapter = adapter.id;
      container.dataset.rendererSourceId = adapterSource.sourceId;
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return undefined;
    }

    Promise.resolve(adapter.mount({ source: validation.source, container, context }))
      .then((instance) => {
        if (cancelled) {
          adapter.unmount({ instance, container, context });
          return;
        }
        lifecycleRef.current = createLifecycleInstance(adapter.id, sourceKey, instance);
        setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      })
      .catch(() => {
        if (!cancelled) setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      });

    return () => {
      cancelled = true;
      if (!lifecycleRef.current) return;
      adapter.unmount({ instance: lifecycleRef.current.instance, container, context });
      lifecycleRef.current = null;
    };
  }, [adapter, lessonId, sectionId, source.diagramId, source.source, source.sourceId, theme]);

  return (
    <figure className="mermaid-block" data-source-id={source.sourceId} data-source-mermaid={source.source}>
      <div ref={containerRef} aria-label="Rendered Mermaid diagram" />
      {diagnostics.length ? (
        <figcaption className="renderer-diagnostic" role="status">
          {diagnostics[0].message}
        </figcaption>
      ) : null}
    </figure>
  );
}

function createMermaidContext({
  blockId,
  container,
  lessonId,
  reportDiagnostic,
  sectionId,
  theme,
}: {
  blockId: string;
  container: HTMLElement;
  lessonId: string;
  reportDiagnostic: (diagnostic: AdapterDiagnostic) => void;
  sectionId: string;
  theme: MermaidSource['theme'];
}): RendererContext {
  return {
    lessonId,
    sectionId,
    blockId,
    rendererId: 'mermaid',
    phase: 'app',
    theme,
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
