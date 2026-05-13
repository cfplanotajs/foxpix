import { describe, expect, it } from 'vitest';
import { clearRecentPaths, pushRecentPath, sanitizeRecentPaths } from '../src/ui/recentPaths.js';

describe('recent paths', () => {
  it('dedupes and keeps most recent first', () => {
    expect(pushRecentPath(['/b', '/a'], '/a')).toEqual(['/a', '/b']);
  });
  it('caps to 8', () => {
    const many = Array.from({ length: 8 }, (_, i) => `/${i}`);
    expect(pushRecentPath(many, '/new').length).toBe(8);
  });
  it('clears', () => {
    expect(clearRecentPaths()).toEqual([]);
  });
  it('sanitizes invalid recents', () => {
    expect(sanitizeRecentPaths(['a', 1, null])).toEqual(['a']);
    expect(sanitizeRecentPaths(undefined)).toEqual([]);
  });
});
