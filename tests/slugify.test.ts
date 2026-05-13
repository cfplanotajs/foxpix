import { describe, expect, it } from 'vitest';
import { slugify } from '../src/core/slugify.js';

describe('slugify', () => {
  it('lowercases text', () => {
    expect(slugify('My Cute Cat')).toBe('my-cute-cat');
  });

  it('converts spaces and underscores to hyphens', () => {
    expect(slugify('Animal_Habitat Area')).toBe('animal-habitat-area');
  });

  it('removes unsafe characters', () => {
    expect(slugify('IMG_001 (Final).png')).toBe('img-001-final-png');
  });

  it('falls back to image when empty', () => {
    expect(slugify('!!!___   ')).toBe('image');
  });
});
