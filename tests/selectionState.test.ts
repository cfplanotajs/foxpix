import { describe, expect, it } from 'vitest';
import { computeSelectionCounts, hasIncludedRows, initializeIncludedMap } from '../src/ui/selectionState.js';

const rows = [{ id: '1' }, { id: '2' }, { id: '3' }];

describe('selection state helpers', () => {
  it('computes counts', () => {
    const counts = computeSelectionCounts(rows, { '2': false });
    expect(counts).toEqual({ total: 3, included: 2, skipped: 1 });
  });

  it('detects no included rows', () => {
    expect(hasIncludedRows(rows, { '1': false, '2': false, '3': false })).toBe(false);
    expect(hasIncludedRows(rows, {})).toBe(true);
  });
});

  it('initializes included map with all true', () => {
    expect(initializeIncludedMap(rows)).toEqual({ '1': true, '2': true, '3': true });
  });
