export type RendererPhase = 'app' | 'student-export' | 'reveal-export' | 'print' | 'pdf';

export type ExportTarget =
  | { kind: 'json' }
  | { kind: 'student-html' }
  | { kind: 'reveal-html' }
  | { kind: 'print-dom' }
  | { kind: 'pdf-source' };

export type AdapterDiagnostic = {
  severity: 'info' | 'warning' | 'error';
  rendererId: string;
  code: string;
  message: string;
  lessonId?: string;
  sectionId?: string;
  blockId?: string;
  sourceExcerpt?: string;
  cause?: unknown;
};

export type AdapterValidation<TSource> =
  | { ok: true; source: TSource; diagnostics: AdapterDiagnostic[] }
  | { ok: false; fallbackSource: unknown; diagnostics: AdapterDiagnostic[] };

export type RendererContext = {
  lessonId: string;
  sectionId: string;
  blockId: string;
  rendererId: string;
  phase: RendererPhase;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  isMobile: boolean;
  isVisible: boolean;
  containerSize: { width: number; height: number };
  reportDiagnostic(diagnostic: AdapterDiagnostic): void;
  scheduleAfterVisible(callback: () => void): void;
};

export interface RendererAdapter<TSource, TInstance, TExport = unknown> {
  readonly id: string;
  readonly displayName: string;

  validate(source: unknown): AdapterValidation<TSource>;

  mount(args: {
    source: TSource;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<TInstance> | TInstance;

  update?(args: {
    source: TSource;
    instance: TInstance;
    container: HTMLElement;
    context: RendererContext;
  }): Promise<TInstance> | TInstance;

  resize?(args: { instance: TInstance; container: HTMLElement; context: RendererContext }): void;

  export?(args: {
    source: TSource;
    instance: TInstance | null;
    target: ExportTarget;
    context: RendererContext;
  }): Promise<TExport> | TExport;

  unmount(args: { instance: TInstance; container: HTMLElement; context: RendererContext }): void;
}
