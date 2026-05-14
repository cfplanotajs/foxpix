export function computeSelectionCounts<T extends { id: string }>(rows: T[], includedMap: Record<string, boolean>): { total: number; included: number; skipped: number } {
  const included = rows.filter((r) => includedMap[r.id] !== false).length;
  return { total: rows.length, included, skipped: rows.length - included };
}

export function hasIncludedRows<T extends { id: string }>(rows: T[], includedMap: Record<string, boolean>): boolean {
  return rows.some((r) => includedMap[r.id] !== false);
}

export function initializeIncludedMap<T extends { id: string }>(rows: T[]): Record<string, boolean> {
  return Object.fromEntries(rows.map((r) => [r.id, true]));
}
