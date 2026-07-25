import type { KaTeXSource } from '../renderers/katex/katexAdapter';
import type { MermaidSource } from '../renderers/mermaid/mermaidAdapter';

export type ShellSection = {
  id: string;
  label: string;
  eyebrow: string;
  heading: string;
  body: string[];
  mathBlocks?: KaTeXSource[];
  mermaidBlocks?: Array<Omit<MermaidSource, 'theme'>>;
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
          'This panel is placeholder content. KaTeX, MathLive, Plotly, Mermaid, JSXGraph, Arquero, quiz, authoring, and export runtimes remain scheduled for later phases.',
        ],
      },
      {
        id: 'math-renderers',
        label: 'Renderers',
        eyebrow: 'Renderer host placeholder',
        heading: 'Renderer container boundary',
        body: [
          'The eventual renderer host will attach adapter lifecycles to stable DOM containers.',
          'Phase 2 starts with one narrow adapter at a time. KaTeX is mounted through a dedicated host while other renderers remain deferred.',
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
