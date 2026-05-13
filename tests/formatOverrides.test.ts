import { describe, expect, it } from 'vitest';
import { getEffectiveOutputFormat } from '../src/ui/formatOverrides.js';

describe('format overrides helper', () => {
  it('falls back to global with no override', () => {
    expect(getEffectiveOutputFormat('a', 'webp', {})).toBe('webp');
  });

  it('uses override when present', () => {
    expect(getEffectiveOutputFormat('a', 'webp', { a: 'png' })).toBe('png');
  });
});
