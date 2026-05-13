import type { OutputFormat } from '../types/index.js';

export function getEffectiveOutputFormat(rowId: string, globalFormat: OutputFormat, overrides: Record<string, OutputFormat>): OutputFormat {
  return overrides[rowId] ?? globalFormat;
}

export function applyBulkIncludedOverrides<T extends { id: string }>(rows: T[], includedMap: Record<string, boolean>, overrides: Record<string, OutputFormat>, format: OutputFormat): Record<string, OutputFormat> {
  const next = { ...overrides };
  rows.forEach((row) => {
    if (includedMap[row.id] !== false) next[row.id] = format;
  });
  return next;
}

export function resetAllOverrides(): Record<string, OutputFormat> {
  return {};
}
