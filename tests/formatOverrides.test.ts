import { describe, expect, it } from 'vitest';
import { applyBulkIncludedOverrides, getEffectiveOutputFormat, resetAllOverrides } from '../src/ui/formatOverrides.js';

describe('format overrides helper', () => {
  it('falls back to global with no override', () => {
    expect(getEffectiveOutputFormat('a', 'webp', {})).toBe('webp');
  });

  it('uses override when present', () => {
    expect(getEffectiveOutputFormat('a', 'webp', { a: 'png' })).toBe('png');
  });

  it('bulk set applies only to included rows', () => {
    const rows = [{ id: '1' }, { id: '2' }];
    const overrides = applyBulkIncludedOverrides(rows, { '2': false }, {}, 'png');
    expect(overrides['1']).toBe('png');
    expect(overrides['2']).toBeUndefined();
  });

  it('reset clears overrides', () => {
    expect(resetAllOverrides()).toEqual({});
  });
});
