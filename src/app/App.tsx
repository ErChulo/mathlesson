import { startTransition, useEffect, useState } from 'react';
import { KaTeXBlock } from '../components/renderers/KaTeXBlock';
import { MediaBlock } from '../components/renderers/MediaBlock';
import { MermaidBlock } from '../components/renderers/MermaidBlock';
import { PlotlyBlock } from '../components/renderers/PlotlyBlock';
import { SvgBlock } from '../components/renderers/SvgBlock';
import { usePersistentJsonState, usePersistentRawState } from '../hooks/usePersistentState';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  defaultLayoutState,
  isLayoutState,
  isThemeName,
  storageKeys,
  type LayoutState,
  type SidebarMode,
  type ThemeName,
} from './persistence';
import {
  advancedPanels,
  firstLessonKey,
  getLessonByKey,
  isKnownLessonKey,
  isPanelIdForLesson,
  type AdvancedPanel,
  type ShellSection,
} from './phaseOneData';

const sidebarModes: SidebarMode[] = ['expanded', 'collapsed', 'hidden'];

function isAdvancedOpenValue(value: string): boolean {
  return value === '1' || value === '0';
}

function nextSidebarMode(current: SidebarMode): SidebarMode {
  const index = sidebarModes.indexOf(current);
  return sidebarModes[(index + 1) % sidebarModes.length];
}

function nextTheme(current: ThemeName): ThemeName {
  return current === 'dark' ? 'light' : 'dark';
}

export function App() {
  const [lessonKey, setLessonKey] = usePersistentJsonState(storageKeys.lesson, firstLessonKey, isKnownLessonKey);
  const lesson = getLessonByKey(lessonKey);
  const [activePanelId, setActivePanelId] = usePersistentJsonState(
    storageKeys.section(lesson.key),
    lesson.sections[0].id,
    (value): value is string => isPanelIdForLesson(lesson, value),
  );
  const [theme, setTheme] = usePersistentJsonState<ThemeName>(storageKeys.theme, 'dark', isThemeName);
  const [layout, setLayout] = usePersistentJsonState<LayoutState>(
    storageKeys.layout,
    defaultLayoutState,
    isLayoutState,
  );
  const [advancedOpenRaw, setAdvancedOpenRaw] = usePersistentRawState(
    storageKeys.advancedNavOpen,
    '0',
    isAdvancedOpenValue,
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const activeSection = lesson.sections.find((section) => section.id === activePanelId);
  const activeAdvancedPanel = advancedPanels.find((panel) => panel.id === activePanelId);
  const activePanel = activeSection ?? activeAdvancedPanel ?? lesson.sections[0];
  const advancedOpen = advancedOpenRaw === '1';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  useEffect(() => {
    if (!isPanelIdForLesson(lesson, activePanelId)) {
      setActivePanelId(lesson.sections[0].id);
    }
  }, [activePanelId, lesson, setActivePanelId]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  function activatePanel(panelId: string) {
    startTransition(() => setActivePanelId(panelId));
    setMobileSidebarOpen(false);
  }

  function selectLesson(nextLessonKey: string) {
    if (!isKnownLessonKey(nextLessonKey)) return;
    startTransition(() => setLessonKey(nextLessonKey));
    setMobileSidebarOpen(false);
  }

  function cycleSidebar() {
    setLayout((current) => ({ ...current, sidebar: nextSidebarMode(current.sidebar) }));
  }

  function toggleWideContent() {
    setLayout((current) => ({ ...current, wide: !current.wide }));
  }

  function toggleAdvancedOpen() {
    setAdvancedOpenRaw(advancedOpen ? '0' : '1');
  }

  const appClassName = [
    'app-shell',
    `sidebar-${layout.sidebar}`,
    layout.wide ? 'wide-content' : '',
    mobileSidebarOpen ? 'mobile-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={appClassName}>
      <button
        aria-label="Open navigation"
        className="mobile-menu-button"
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
      >
        Menu
      </button>

      <aside className="sidebar" aria-label="Lesson navigation">
        <div className="sidebar-logo">
          <span className="logo-mark">ML</span>
          <span>
            <strong>MathLesson</strong>
            <small>React migration shell</small>
          </span>
        </div>

        <label className="field-label" htmlFor="lesson-select">
          Lesson
        </label>
        <select
          id="lesson-select"
          value={lesson.key}
          onChange={(event) => selectLesson(event.target.value)}
        >
          <option value="demo">Framework Demo</option>
          <option value="audit">Phase 0 Audit</option>
        </select>

        <nav className="nav-group" aria-label="Lesson sections">
          <div className="nav-group-title">Sections</div>
          {lesson.sections.map((section) => (
            <button
              key={section.id}
              className={section.id === activePanelId ? 'nav-item active' : 'nav-item'}
              type="button"
              onClick={() => activatePanel(section.id)}
            >
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-separator" />

        <button className="nav-disclosure" type="button" onClick={toggleAdvancedOpen} aria-expanded={advancedOpen}>
          Advanced panels
        </button>
        {advancedOpen ? (
          <nav className="nav-group" aria-label="Advanced panels">
            {advancedPanels.map((panel) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'nav-item active' : 'nav-item'}
                type="button"
                onClick={() => activatePanel(panel.id)}
              >
                <span>{panel.label}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </aside>

      {mobileSidebarOpen ? (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <header className="topbar">
        <div>
          <p className="eyebrow">Phase 1 shell</p>
          <div className="breadcrumb">
            <span>{lesson.title}</span>
            <span>/</span>
            <span>{activePanel.label}</span>
          </div>
        </div>
        <div className="topbar-actions" aria-label="Shell controls">
          <span className="status-chip">v4.9.22 baseline preserved</span>
          <button type="button" onClick={() => setTheme(nextTheme(theme))}>
            Theme: {theme}
          </button>
          <button type="button" onClick={cycleSidebar}>
            Sidebar: {layout.sidebar}
          </button>
          <button type="button" onClick={toggleWideContent}>
            {layout.wide ? 'Standard width' : 'Wide content'}
          </button>
        </div>
      </header>

      <main className="content" id="content" tabIndex={-1}>
        <section className="panel-card" aria-labelledby="panel-heading">
          {'heading' in activePanel ? (
            <LessonPanel lessonId={lesson.key} layoutKey={`${layout.sidebar}:${layout.wide}`} section={activePanel} theme={theme} />
          ) : (
            <AdvancedPanelCard panel={activePanel} />
          )}
        </section>
      </main>
    </div>
  );
}

function LessonPanel({
  layoutKey,
  lessonId,
  section,
  theme,
}: {
  layoutKey: string;
  lessonId: string;
  section: ShellSection;
  theme: ThemeName;
}) {
  return (
    <>
      <p className="panel-eyebrow">{section.eyebrow}</p>
      <h1 id="panel-heading">{section.heading}</h1>
      {section.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.mathBlocks?.map((source) => (
        <KaTeXBlock key={source.sourceId} lessonId={lessonId} sectionId={section.id} source={source} />
      ))}
      {section.mermaidBlocks?.map((source) => (
        <MermaidBlock key={source.sourceId} lessonId={lessonId} sectionId={section.id} source={source} theme={theme} />
      ))}
      {section.svgBlocks?.map((source) => (
        <SvgBlock key={source.sourceId} lessonId={lessonId} sectionId={section.id} source={source} />
      ))}
      {section.mediaBlocks?.map((source) => (
        <MediaBlock key={source.sourceId} lessonId={lessonId} sectionId={section.id} source={source} />
      ))}
      {section.plotlyBlocks?.map((source) => (
        <PlotlyBlock key={source.sourceId} layoutKey={layoutKey} lessonId={lessonId} sectionId={section.id} source={source} theme={theme} />
      ))}
      <div className="phase-boundary" role="note">
        Phase 2 mounts only approved adapter slices here. Quiz, authoring, import/export, MathLive, and other renderer
        behavior remains in the preserved baseline until its migration phase.
      </div>
    </>
  );
}

function AdvancedPanelCard({ panel }: { panel: AdvancedPanel }) {
  return (
    <>
      <p className="panel-eyebrow">{panel.status}</p>
      <h1 id="panel-heading">{panel.label}</h1>
      <p>{panel.summary}</p>
      <div className="phase-boundary" role="note">
        This destination exists so Phase 1 can validate navigation and layout without mounting deferred feature code.
      </div>
    </>
  );
}
