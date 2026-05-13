import { describe, expect, it } from 'vitest';
import { filterPreviewRows } from '../src/ui/reviewState.js';
import type { PreviewRow } from '../src/ui/types.js';

const rows: PreviewRow[] = [
  { id: '1', sourcePath: '/a.png', originalFilename: 'a.png', outputFilename: 'a.webp', originalSize: 10, sourceFormat: 'png', targetFormat: 'webp', status: 'planned' },
  { id: '2', sourcePath: '/b.png', originalFilename: 'b.png', outputFilename: 'b.jpg', originalSize: 20, sourceFormat: 'png', targetFormat: 'jpeg', status: 'failed', error: 'JPEG does not support transparency' },
  { id: '3', sourcePath: '/c.jpg', originalFilename: 'c.jpg', outputFilename: 'c.webp', originalSize: 30, sourceFormat: 'jpg', targetFormat: 'webp', status: 'estimated' }
];

describe('review state filters', () => {
  it('filters included/skipped rows', () => {
    const includedMap = { '2': false };
    expect(filterPreviewRows(rows, 'included', '', includedMap, {}).map((r) => r.id)).toEqual(['1', '3']);
    expect(filterPreviewRows(rows, 'skipped', '', includedMap, {}).map((r) => r.id)).toEqual(['2']);
  });

  it('filters overrides and composes with search', () => {
    const result = filterPreviewRows(rows, 'overrides', 'a.', {}, { '1': 'png' });
    expect(result.map((r) => r.id)).toEqual(['1']);
  });

  it('filters warnings/errors', () => {
    expect(filterPreviewRows(rows, 'warnings', '', {}, {}).map((r) => r.id)).toContain('2');
    expect(filterPreviewRows(rows, 'errors', '', {}, {}).map((r) => r.id)).toEqual(['2']);
  });
});
