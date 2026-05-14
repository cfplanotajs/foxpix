import { describe, expect, it } from 'vitest';
import { executeRecommendationAction, undoRecommendationAction } from '../src/ui/recommendationActions.js';

const rows: any[] = [
  { id: '1', error: 'JPEG does not support transparency' },
  { id: '2', error: '' }
];

describe('recommendationActions', () => {
  it('set-pattern updates pattern and stale flags', () => {
    const r = executeRecommendationAction({ action: { type: 'set-pattern', label: 'x', pattern: '{name}' }, rows, includedMap: {}, formatOverrides: {}, options: { pattern: '{prefix}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false }, activeFilter: 'all' });
    expect(r.nextOptions?.pattern).toBe('{name}');
    expect(r.clearEstimates).toBe(true);
  });
  it('select-all includes every row', () => {
    const r = executeRecommendationAction({ action: { type: 'select-all', label: 'x' }, rows, includedMap: { '1': false }, formatOverrides: {}, options: { pattern: '{name}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false }, activeFilter: 'all' });
    expect(r.nextIncludedMap?.['1']).toBe(true);
    expect(r.nextIncludedMap?.['2']).toBe(true);
  });
  it('set-review-filter only changes filter', () => {
    const r = executeRecommendationAction({ action: { type: 'set-review-filter', label: 'x', filter: 'renamed' }, rows, includedMap: {}, formatOverrides: {}, options: { pattern: '{name}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false }, activeFilter: 'all' });
    expect(r.nextFilter).toBe('renamed');
    expect(r.nextOptions).toBeUndefined();
  });
  it('risky jpeg action affects only included risky rows and supports undo', () => {
    const r = executeRecommendationAction({ action: { type: 'set-risky-jpeg-rows-to-webp', label: 'x' }, rows, includedMap: { '2': false }, formatOverrides: {}, options: { pattern: '{name}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false }, activeFilter: 'all' });
    expect(r.nextFormatOverrides?.['1']).toBe('webp');
    expect(r.nextFormatOverrides?.['2']).toBeUndefined();
    const u = undoRecommendationAction(r.undoSnapshot!);
    expect(u.nextFormatOverrides).toEqual({});
  });
});
