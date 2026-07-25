import { useEffect, useRef, useState } from 'react';
import { createLifecycleInstance, type RendererLifecycleInstance } from '../../renderers/core/lifecycle';
import type { AdapterDiagnostic, RendererContext } from '../../renderers/core/types';
import {
  getPlotlySourceKey,
  plotlyAdapter,
  type PlotlyInstance,
  type PlotlySource,
} from '../../renderers/plotly/plotlyAdapter';

type PlotlyBlockProps = {
  source: PlotlySource;
  lessonId: string;
  sectionId: string;
  theme: RendererContext['theme'];
  layoutKey: string;
  adapter?: typeof plotlyAdapter;
};

export function PlotlyBlock({ source, lessonId, sectionId, theme, layoutKey, adapter = plotlyAdapter }: PlotlyBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lifecycleRef = useRef<RendererLifecycleInstance<PlotlyInstance> | null>(null);
  const requestIdRef = useRef(0);
  const [diagnostics, setDiagnostics] = useState<AdapterDiagnostic[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;
    const nextDiagnostics: AdapterDiagnostic[] = [];
    const context = createPlotlyContext({
      blockId: source.sourceId,
      container,
      lessonId,
      reportDiagnostic: (diagnostic) => nextDiagnostics.push(diagnostic),
      sectionId,
      theme,
    });
    const validation = adapter.validate(source);
    const currentLifecycle = lifecycleRef.current;

    if (!validation.ok) {
      if (currentLifecycle) {
        adapter.unmount({ instance: currentLifecycle.instance, container, context });
        lifecycleRef.current = null;
      }

      container.textContent = validation.diagnostics[0]?.message ?? 'Plotly source could not be rendered.';
      container.dataset.rendererAdapter = adapter.id;
      container.dataset.rendererSourceId = source.sourceId;
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return undefined;
    }

    const sourceKey = getPlotlySourceKey(validation.source);
    if (currentLifecycle?.adapterId === adapter.id && currentLifecycle.sourceKey === sourceKey) {
      adapter.resize?.({ instance: currentLifecycle.instance, container, context });
      setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      return undefined;
    }

    const result = currentLifecycle?.adapterId === adapter.id
      ? adapter.update?.({ source: validation.source, instance: currentLifecycle.instance, container, context }) ??
        adapter.mount({ source: validation.source, container, context })
      : adapter.mount({ source: validation.source, container, context });

    Promise.resolve(result)
      .then((instance) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        lifecycleRef.current = createLifecycleInstance(adapter.id, sourceKey, instance);
        setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      })
      .catch(() => {
        if (!cancelled && requestIdRef.current === requestId) setDiagnostics([...validation.diagnostics, ...nextDiagnostics]);
      });

    return () => {
      cancelled = true;
    };
  }, [adapter, layoutKey, lessonId, sectionId, source, theme]);

  useEffect(() => {
    return () => {
      const container = containerRef.current;
      const lifecycle = lifecycleRef.current;
      if (!container || !lifecycle) return;

      const context = createPlotlyContext({
        blockId: lifecycle.instance.source.sourceId,
        container,
        lessonId,
        reportDiagnostic: () => undefined,
        sectionId,
        theme,
      });
      adapter.unmount({ instance: lifecycle.instance, container, context });
      lifecycleRef.current = null;
    };
  }, [adapter, lessonId, sectionId, theme]);

  return (
    <figure className="plotly-block" data-source-id={source.sourceId}>
      <div ref={containerRef} className="plotly-frame" aria-label={source.title || 'Interactive Plotly chart'} />
      {diagnostics.length ? (
        <figcaption className="renderer-diagnostic" role="status">
          {diagnostics[0].message}
        </figcaption>
      ) : null}
    </figure>
  );
}

function createPlotlyContext({
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
  theme: RendererContext['theme'];
}): RendererContext {
  const rect = container.getBoundingClientRect?.();
  const width = Math.round(Math.max(container.clientWidth, rect?.width ?? 0));
  const height = Math.round(Math.max(container.clientHeight, rect?.height ?? 0));

  return {
    lessonId,
    sectionId,
    blockId,
    rendererId: plotlyAdapter.id,
    phase: 'app',
    theme,
    reducedMotion: document.documentElement.dataset.motion === 'reduced',
    isMobile: window.matchMedia?.('(max-width: 780px)').matches ?? false,
    isVisible: width >= 40,
    containerSize: { width, height },
    reportDiagnostic,
    scheduleAfterVisible: (callback) => {
      requestAnimationFrame(() => requestAnimationFrame(callback));
    },
  };
}
