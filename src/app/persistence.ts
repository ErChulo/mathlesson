export type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

export type LayoutState = {
  sidebar: SidebarMode;
  wide: boolean;
};

export type ThemeName = 'dark' | 'light';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const defaultLayoutState: LayoutState = {
  sidebar: 'expanded',
  wide: false,
};

export const storageKeys = {
  lesson: 'ml_lesson',
  section: (lessonKey: string) => `ml_section_${lessonKey}`,
  theme: 'ml_theme_v1',
  layout: 'ml_workspace_layout_v1',
  advancedNavOpen: 'ml_advanced_nav_open',
} as const;

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light';
}

export function isSidebarMode(value: unknown): value is SidebarMode {
  return value === 'expanded' || value === 'collapsed' || value === 'hidden';
}

export function isLayoutState(value: unknown): value is LayoutState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LayoutState>;
  return isSidebarMode(candidate.sidebar) && typeof candidate.wide === 'boolean';
}

export function readJsonValue<T>(
  storage: StorageLike | undefined,
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonValue<T>(storage: StorageLike | undefined, key: string, value: T): void {
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Preserve the forgiving persistence behavior observed in the baseline.
  }
}

export function readRawValue(
  storage: StorageLike | undefined,
  key: string,
  fallback: string,
  isValid: (value: string) => boolean,
): string {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    return raw !== null && isValid(raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}

export function writeRawValue(storage: StorageLike | undefined, key: string, value: string): void {
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // Preserve the forgiving persistence behavior observed in the baseline.
  }
}
