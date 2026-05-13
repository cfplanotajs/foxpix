import type { OutputFormat } from '../types/index.js';

export function getEffectiveOutputFormat(rowId: string, globalFormat: OutputFormat, overrides: Record<string, OutputFormat>): OutputFormat {
  return overrides[rowId] ?? globalFormat;
}
