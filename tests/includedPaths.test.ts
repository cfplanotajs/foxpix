import { describe, expect, it } from 'vitest';
import { filterDiscoveredFilesByIncludedPaths } from '../src/core/includedPaths.js';
import type { DiscoveredFile } from '../src/types/index.js';

const files: DiscoveredFile[] = [
  { absolutePath: '/tmp/a.png', relativePath: 'a.png', name: 'a', extension: '.png', folderName: 'x' },
  { absolutePath: '/tmp/b.png', relativePath: 'b.png', name: 'b', extension: '.png', folderName: 'x' }
];

describe('includedPaths filtering', () => {
  it('includes all files when includedPaths is absent', () => {
    expect(filterDiscoveredFilesByIncludedPaths(files).length).toBe(2);
  });

  it('includes only matching paths', () => {
    const result = filterDiscoveredFilesByIncludedPaths(files, ['/tmp/a.png']);
    expect(result.map((f) => f.absolutePath)).toEqual(['/tmp/a.png']);
  });

  it('returns empty on empty includedPaths', () => {
    expect(filterDiscoveredFilesByIncludedPaths(files, []).length).toBe(0);
  });

  it('does not match by filename only', () => {
    expect(filterDiscoveredFilesByIncludedPaths(files, ['/other/a.png']).length).toBe(0);
  });
});
