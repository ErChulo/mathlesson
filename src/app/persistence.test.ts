import { describe, expect, it } from 'vitest';
import {
  defaultLayoutState,
  isLayoutState,
  isThemeName,
  readJsonValue,
  readRawValue,
  storageKeys,
  writeJsonValue,
  writeRawValue,
  type StorageLike,
} from './persistence';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('persistence helpers', () => {
  it('round-trips JSON values with legacy key names', () => {
    const storage = new MemoryStorage();

    writeJsonValue(storage, storageKeys.theme, 'light');

    expect(storage.getItem(storageKeys.theme)).toBe('"light"');
    expect(readJsonValue(storage, storageKeys.theme, 'dark', isThemeName)).toBe('light');
  });

  it('falls back on malformed JSON and invalid shapes', () => {
    const storage = new MemoryStorage();

    storage.setItem(storageKeys.layout, '{broken');
    expect(readJsonValue(storage, storageKeys.layout, defaultLayoutState, isLayoutState)).toEqual(defaultLayoutState);

    storage.setItem(storageKeys.layout, JSON.stringify({ sidebar: 'floating', wide: true }));
    expect(readJsonValue(storage, storageKeys.layout, defaultLayoutState, isLayoutState)).toEqual(defaultLayoutState);
  });

  it('preserves raw advanced-nav values', () => {
    const storage = new MemoryStorage();

    writeRawValue(storage, storageKeys.advancedNavOpen, '1');

    expect(storage.getItem(storageKeys.advancedNavOpen)).toBe('1');
    expect(readRawValue(storage, storageKeys.advancedNavOpen, '0', (value) => value === '1' || value === '0')).toBe('1');
  });
});
