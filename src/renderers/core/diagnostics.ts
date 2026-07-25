import type { AdapterDiagnostic } from './types';

export function createAdapterDiagnostic(diagnostic: AdapterDiagnostic): AdapterDiagnostic {
  return diagnostic;
}

export function getSourceExcerpt(source: unknown, maxLength = 120): string | undefined {
  if (typeof source !== 'string') return undefined;
  return source.length > maxLength ? `${source.slice(0, maxLength)}...` : source;
}
