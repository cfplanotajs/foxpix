import { describe, expect, it } from 'vitest';
import { getPresetDisplayName, getPresetMatchState, mergeImportedPresets, normalizePresetName, parsePresetPack, savePreset, serializePresetPack } from '../src/ui/customPresets.js';

const options = { pattern: '{name}', quality: 80, alphaQuality: 99, effort: 3, lossless: false, keepMetadata: false, recursive: true, outputFormat: 'webp' as const };

describe('custom presets', () => {
  it('rejects empty or whitespace names', () => {
    expect(normalizePresetName('')).toEqual({ ok: false, error: 'Preset name cannot be empty.' });
    expect(normalizePresetName('   ').ok).toBe(false);
  });
  it('trims and validates names', () => {
    const r = normalizePresetName('  Amazon PDP  ');
    expect(r.ok && r.value).toBe('Amazon PDP');
  });
  it('save updates same-name case-insensitive', () => {
    const first = savePreset([], 'Amazon', options);
    const second = savePreset(first.presets, 'amazon', { ...options, quality: 40 });
    expect(second.presets).toHaveLength(1);
    expect(second.status).toBe('Preset updated.');
  });
  it('modified state ignores source/output paths', () => {
    const saved = savePreset([], 'Team', options);
    const id = saved.saved!.id;
    const same = getPresetMatchState({ ...options, input: '/a', output: '/b' }, `custom:${id}`, saved.presets as any);
    expect(same.modified).toBe(false);
    const changed = getPresetMatchState({ ...options, quality: 90 }, `custom:${id}`, saved.presets as any);
    expect(changed.modified).toBe(true);
  });
  it('resolves friendly built-in and custom names', () => {
    expect(getPresetDisplayName('shopify-transparent', [])).toBe('Shopify transparent assets');
    const saved = savePreset([], 'Amazon PDP', options);
    expect(getPresetDisplayName(`custom:${saved.saved!.id}`, saved.presets as any)).toBe('Custom: Amazon PDP');
  });
  it('modified label uses friendly built-in name and unknown fallback', () => {
    const state = getPresetMatchState({ ...options, quality: 81 }, 'shopify-transparent', []);
    expect(state.label).toBe('Modified from Shopify transparent assets');
    const unknown = getPresetDisplayName('custom:missing', []);
    expect(unknown).toBe('Custom settings');
  });

  it('merges imported duplicates with deterministic suffix increments', () => {
    const existing = savePreset([], 'Amazon PDP', options).presets;
    const imported = [{ ...existing[0], id: 'x' } as any];
    const once = mergeImportedPresets(existing as any, imported as any);
    expect(once.some((p) => p.name === 'Amazon PDP (imported)')).toBe(true);
    const twice = mergeImportedPresets(once as any, imported as any);
    expect(twice.some((p) => p.name === 'Amazon PDP (imported 2)')).toBe(true);
  });

  it('handles case-insensitive imported name collisions and multiple duplicates', () => {
    const existing = [{ id: '1', name: 'amazon pdp', createdAt: '', updatedAt: '', settings: savePreset([], 'X', options).presets[0].settings } as any, { id: '2', name: 'Amazon PDP (imported)', createdAt: '', updatedAt: '', settings: savePreset([], 'Y', options).presets[0].settings } as any];
    const imported = [{ ...existing[0], id: '3', name: 'Amazon PDP' } as any, { ...existing[0], id: '4', name: 'Amazon PDP' } as any];
    const merged = mergeImportedPresets(existing as any, imported as any);
    expect(merged.some((p) => p.name === 'Amazon PDP (imported 2)')).toBe(true);
    expect(merged.some((p) => p.name === 'Amazon PDP (imported 3)')).toBe(true);
  });

  it('export/import helpers work and merge duplicates safely', () => {
    const saved = savePreset([], 'Amazon', options).presets;
    const pack = serializePresetPack(saved);
    expect(pack.type).toBe('foxpix-presets');
    const parsed = parsePresetPack(JSON.stringify(pack));
    expect(parsed.ok).toBe(true);
    const merged = mergeImportedPresets(saved, (parsed as any).presets);
    expect(merged.some((p) => p.name.includes('(imported)'))).toBe(true);
    expect(parsePresetPack('{bad').ok).toBe(false);
    expect(parsePresetPack(JSON.stringify({ type: 'x', version: 1, presets: [] })).ok).toBe(false);
  });
});
