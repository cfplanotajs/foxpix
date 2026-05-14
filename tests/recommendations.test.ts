import { describe, expect, it } from 'vitest';
import { buildRecommendations, computeFormatMix } from '../src/ui/recommendations.js';
import type { PreviewRow } from '../src/ui/types.js';

const rows: PreviewRow[] = [
  { id: '1', sourcePath: '/a', originalFilename: 'a.png', outputFilename: 'a.jpg', originalSize: 10, sourceFormat: 'png', targetFormat: 'jpeg', status: 'failed', error: 'JPEG does not support transparency', wasRenamedForCollision: true, collisionReason: 'existing-output-file' },
  { id: '2', sourcePath: '/b', originalFilename: 'b.jpg', outputFilename: 'b.webp', originalSize: 10, sourceFormat: 'jpg', targetFormat: 'webp', status: 'estimated', estimatedSavedBytes: -2, wasRenamedForCollision: true, collisionReason: 'batch-duplicate' }
];

describe('recommendations', () => {
  it('builds deterministic recommendations', () => {
    const notes = buildRecommendations({ rows, includedMap: {}, outputFormat: 'jpeg', estimatesReady: false, estimatesStale: true });
    expect(notes.some((n) => n.text.includes('transparent images'))).toBe(true);
    expect(notes.some((n) => n.action?.type === 'run-estimate')).toBe(true);
    expect(notes.some((n) => n.action?.type === 'set-review-filter' && n.action.filter === 'larger')).toBe(true);
    expect(notes.some((n) => n.action?.type === 'set-review-filter' && n.action.filter === 'renamed')).toBe(true);
    expect(notes.some((n) => n.action?.type === 'set-risky-jpeg-rows-to-webp')).toBe(true);
    const withStatus = buildRecommendations({ rows, includedMap: {}, outputFormat: 'webp', estimatesReady: true, estimatesStale: false, outputFolderStatus: { status: 'will-create', path: '/out' } });
    expect(withStatus.some((n) => n.text.includes('will be created'))).toBe(true);
  });

  it('computes format mix', () => {
    expect(computeFormatMix(rows)).toEqual({ webp: 1, avif: 0, jpeg: 1, png: 0 });
  });
});
