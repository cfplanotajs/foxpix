import { describe, expect, it } from 'vitest';
import { getActionAvailability } from '../src/ui/actionAvailability.js';

describe('action availability', () => {
  it('disables preview without source', () => {
    expect(getActionAvailability({ bridgeAvailable: true, busy: false, hasSource: false, hasPreviewRows: false, includedCount: 0, hasInvalidSettings: false }).preview.reason).toContain('Choose a source');
  });
  it('disables estimate without preview rows', () => {
    expect(getActionAvailability({ bridgeAvailable: true, busy: false, hasSource: true, hasPreviewRows: false, includedCount: 0, hasInvalidSettings: false }).estimate.reason).toContain('Preview the source');
  });
  it('disables process with zero included', () => {
    expect(getActionAvailability({ bridgeAvailable: true, busy: false, hasSource: true, hasPreviewRows: true, includedCount: 0, hasInvalidSettings: false }).process.reason).toContain('Select at least one');
  });
  it('enables valid state', () => {
    expect(getActionAvailability({ bridgeAvailable: true, busy: false, hasSource: true, hasPreviewRows: true, includedCount: 1, hasInvalidSettings: false }).process.enabled).toBe(true);
  });
});
