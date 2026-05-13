import { describe, expect, it } from 'vitest';
import { DEFAULT_OUTPUT_FORMAT, normalizeOutputFormat } from '../src/types/index.js';

describe('output format compatibility defaults', () => {
  it('defaults undefined to webp', () => {
    expect(normalizeOutputFormat(undefined)).toBe(DEFAULT_OUTPUT_FORMAT);
  });

  it('keeps accepted formats', () => {
    expect(normalizeOutputFormat('webp')).toBe('webp');
    expect(normalizeOutputFormat('avif')).toBe('avif');
    expect(normalizeOutputFormat('jpeg')).toBe('jpeg');
    expect(normalizeOutputFormat('png')).toBe('png');
  });

  it('normalizes invalid values to webp', () => {
    expect(normalizeOutputFormat('bad')).toBe('webp');
  });
});
