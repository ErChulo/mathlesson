import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { readJsonValue, readRawValue, writeJsonValue, writeRawValue, type StorageLike } from '../app/persistence';

function browserStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function usePersistentJsonState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(() => readJsonValue(browserStorage(), key, fallback, isValid));

  useEffect(() => {
    setValue(readJsonValue(browserStorage(), key, fallback, isValid));
  }, [fallback, isValid, key]);

  function setPersistentValue(next: SetStateAction<T>) {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(current) : next;
      writeJsonValue(browserStorage(), key, resolved);
      return resolved;
    });
  }

  return [value, setPersistentValue];
}

export function usePersistentRawState(
  key: string,
  fallback: string,
  isValid: (value: string) => boolean,
): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState(() => readRawValue(browserStorage(), key, fallback, isValid));

  useEffect(() => {
    setValue(readRawValue(browserStorage(), key, fallback, isValid));
  }, [fallback, isValid, key]);

  function setPersistentValue(next: SetStateAction<string>) {
    setValue((current) => {
      const resolved = typeof next === 'function' ? (next as (previous: string) => string)(current) : next;
      writeRawValue(browserStorage(), key, resolved);
      return resolved;
    });
  }

  return [value, setPersistentValue];
}
