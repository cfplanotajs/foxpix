import { describe, expect, it } from 'vitest';
import { buildPatternExample, getPatternWarnings } from '../src/ui/patternAssistant.js';

describe('pattern assistant', () => {
  it('builds expected examples', () => {
    expect(buildPatternExample({ pattern: '{name}', outputFormat: 'webp' })).toBe('my-cute-animal.webp');
    expect(buildPatternExample({ pattern: '{prefix}-{index}', prefix: 'animal', outputFormat: 'webp' })).toBe('animal-001.webp');
    expect(buildPatternExample({ pattern: '{custom}-{name}', custom: 'zoo', outputFormat: 'webp' })).toBe('zoo-my-cute-animal.webp');
    expect(buildPatternExample({ pattern: '{name}', outputFormat: 'png' })).toBe('my-cute-animal.png');
  });
  it('returns warnings for weak patterns', () => {
    expect(getPatternWarnings({ pattern: '' }).length).toBeGreaterThan(0);
    expect(getPatternWarnings({ pattern: '{animal}' }).some((w) => w.includes('Unknown token'))).toBe(true);
    expect(getPatternWarnings({ pattern: '{custom}', custom: '' }).some((w) => w.includes('{custom}'))).toBe(true);
    expect(getPatternWarnings({ pattern: '{prefix}', prefix: '' }).some((w) => w.includes('{prefix}'))).toBe(true);
  });
});
