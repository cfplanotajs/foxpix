import type { OutputFormat } from '../types/index.js';
import type { PreviewRow } from './types.js';

export type ReviewFilter = 'all' | 'included' | 'skipped' | 'overrides' | 'warnings' | 'errors';

export function rowHasOverride(row: PreviewRow, formatOverrides: Record<string, OutputFormat>): boolean {
  return Boolean(formatOverrides[row.id]);
}

export function getRowWarningState(row: PreviewRow): { warning: boolean; error: boolean } {
  const error = row.status === 'failed' || Boolean(row.error);
  const warning = error || row.status === 'warning' || row.error?.includes('JPEG does not support transparency') === true;
  return { warning, error };
}

export function filterPreviewRows(rows: PreviewRow[], filter: ReviewFilter, search: string, includedMap: Record<string, boolean>, formatOverrides: Record<string, OutputFormat>): PreviewRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesSearch = !q || row.originalFilename.toLowerCase().includes(q) || row.outputFilename.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    const included = includedMap[row.id] !== false;
    if (filter === 'included') return included;
    if (filter === 'skipped') return !included;
    if (filter === 'overrides') return rowHasOverride(row, formatOverrides);
    if (filter === 'warnings') return getRowWarningState(row).warning;
    if (filter === 'errors') return getRowWarningState(row).error;
    return true;
  });
}

