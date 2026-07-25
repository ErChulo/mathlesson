import type { KaTeXSource } from '../renderers/katex/katexAdapter';
import type { MediaSource } from '../renderers/media/mediaAdapter';
import type { MermaidSource } from '../renderers/mermaid/mermaidAdapter';
import type { PlotlySource } from '../renderers/plotly/plotlyAdapter';
import type { SvgSource } from '../renderers/svg/svgAdapter';

export type ShellSection = {
  id: string;
  label: string;
  eyebrow: string;
  heading: string;
  body: string[];
  mathBlocks?: KaTeXSource[];
  mediaBlocks?: MediaSource[];
  mermaidBlocks?: Array<Omit<MermaidSource, 'theme'>>;
  plotlyBlocks?: PlotlySource[];
  svgBlocks?: SvgSource[];
};

export type ShellLesson = {
  key: string;
  title: string;
  sections: ShellSection[];
};

export type AdvancedPanel = {
  id: string;
  label: string;
  status: string;
  summary: string;
};

export const phaseOneLessons: ShellLesson[] = [
  {
    key: 'demo',
    title: 'Framework Demo',
    sections: [
      {
        id: 'intro',
        label: 'Introduction',
        eyebrow: 'Lesson placeholder',
        heading: 'Framework Demo shell',
        body: [
          'Phase 1 preserves the application frame and navigation pattern without migrating renderer internals.',
          'This panel is placeholder content. MathLive, legacy Plotly/Explore, JSXGraph, Arquero, quiz, authoring, and export runtimes remain scheduled for later phases.',
        ],
      },
      {
        id: 'math-renderers',
        label: 'Renderers',
        eyebrow: 'Renderer host placeholder',
        heading: 'Renderer container boundary',
        body: [
          'The eventual renderer host will attach adapter lifecycles to stable DOM containers.',
          'Phase 2 mounts one narrow adapter at a time. Current demos use explicit React-owned sources and do not scan arbitrary baseline HTML.',
        ],
        mathBlocks: [
          {
            sourceId: 'phase-2-katex-demo-display',
            tex: 'E = mc^2',
            displayMode: true,
          },
          {
            sourceId: 'phase-2-katex-demo-inline',
            tex: 'a^2 + b^2 = c^2',
            displayMode: false,
          },
        ],
        mermaidBlocks: [
          {
            sourceId: 'phase-2-mermaid-demo-flowchart',
            diagramId: 'phase-2-mermaid-demo-flowchart',
            source: 'flowchart LR\n  Source[Canonical source] --> Adapter[Mermaid adapter]\n  Adapter --> SVG[Rendered SVG]',
          },
        ],
        svgBlocks: [
          {
            sourceId: 'phase-2-svg-demo-unit-square',
            title: 'Unit square SVG',
            markup:
              '<svg width="180" height="180" role="img" aria-label="Unit square"><rect x="30" y="30" width="120" height="120" fill="none" stroke="currentColor" stroke-width="6"/><text x="90" y="170" text-anchor="middle" fill="currentColor">unit square</text></svg>',
          },
        ],
        mediaBlocks: [
          {
            sourceId: 'phase-2-manim-video-placeholder',
            kind: 'video-placeholder',
            placeholderId: 'manim-unit-circle-demo',
            caption: 'Manim video placeholder with preserved source metadata.',
            altText: 'Placeholder for a future Manim unit circle animation.',
            dimensions: { width: 16, height: 9 },
            transcript: 'A future animation will trace points moving around the unit circle.',
          },
        ],
      },
      {
        id: 'plotly-renderer',
        label: 'Plotly',
        eyebrow: 'Structured Plotly adapter',
        heading: 'Base Plotly chart boundary',
        body: [
          'This section mounts a structured Plotly source through the Phase 2 adapter boundary.',
          'Legacy function-string plots, Plotly Explore sliders, statistics plots, and export runtimes remain deferred until their execution and source policies are approved.',
        ],
        plotlyBlocks: [
          {
            sourceId: 'phase-2-plotly-demo-line-chart',
            plotId: 'phase-2-plotly-demo-line-chart',
            title: 'Quadratic growth demo',
            height: 320,
            data: [
              {
                x: [0, 1, 2, 3, 4],
                y: [0, 1, 4, 9, 16],
                mode: 'lines+markers',
                type: 'scatter',
                name: 'y = x^2',
              },
            ],
            layout: {
              xaxis: { title: 'x' },
              yaxis: { title: 'y' },
            },
            config: { displayModeBar: false, responsive: true },
          },
        ],
      },
      {
        id: 'quiz-placeholder',
        label: 'Quiz',
        eyebrow: 'Learner flow placeholder',
        heading: 'Quiz panel boundary',
        body: [
          'Quiz state machines, answer checking, MathLive input handling, and score persistence are not migrated in Phase 1.',
          'The shell can switch to this panel so later phases have a stable destination for learner-mode work.',
        ],
      },
    ],
  },
  {
    key: 'audit',
    title: 'Phase 0 Audit',
    sections: [
      {
        id: 'intro',
        label: 'Audit Summary',
        eyebrow: 'Evidence checkpoint',
        heading: 'Phase 0 audit placeholder',
        body: [
          'The preserved v4.9.22 baseline, static inventories, ADRs, and migration plan remain under legacy, analysis, and docs.',
          'This shell intentionally references none of the preserved or derived code at runtime.',
        ],
      },
      {
        id: 'phase-plan',
        label: 'Phase Plan',
        eyebrow: 'Migration roadmap',
        heading: 'Phased migration guardrails',
        body: [
          'Phase 1 is limited to shell, layout, persistence, mobile frame behavior, and reduced-motion detection.',
          'Behavioral parity work starts only after dedicated renderer and learner tests exist.',
        ],
      },
    ],
  },
];

export const advancedPanels: AdvancedPanel[] = [
  {
    id: 'calculator',
    label: 'Calculator',
    status: 'Deferred to Phase 3 or 4',
    summary: 'Calculator engines and insertion targets remain documented but unmigrated.',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    status: 'Deferred to Phase 3 or 8',
    summary: 'Statistics widgets and deterministic numerical tests are outside the shell milestone.',
  },
  {
    id: 'author-workspace',
    label: 'Author Workspace',
    status: 'Deferred to Phase 4',
    summary: 'CodeMirror, import, workspace, structured blocks, and schema tools are not mounted yet.',
  },
  {
    id: 'print-export',
    label: 'Print and Exports',
    status: 'Deferred to Phase 5',
    summary: 'JSON, student standalone, Reveal, and print/PDF pipelines remain baseline-only.',
  },
];

export const firstLessonKey = phaseOneLessons[0].key;

export function getLessonByKey(key: string): ShellLesson {
  return phaseOneLessons.find((lesson) => lesson.key === key) ?? phaseOneLessons[0];
}

export function isKnownLessonKey(value: unknown): value is string {
  return typeof value === 'string' && phaseOneLessons.some((lesson) => lesson.key === value);
}

export function isPanelIdForLesson(lesson: ShellLesson, value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return lesson.sections.some((section) => section.id === value) || advancedPanels.some((panel) => panel.id === value);
}
