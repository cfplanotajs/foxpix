import { describe, expect, it } from 'vitest';
import { deletePreset, normalizePresetSettings, renamePreset, sanitizeCustomPresets, savePreset, settingsFromOptions } from '../src/ui/customPresets.js';

const options = { pattern: '{name}', quality: 80, alphaQuality: 99, effort: 3, lossless: false, keepMetadata: false, recursive: true, outputFormat: 'webp' as const };

describe('custom presets', () => {
  it('sanitize handles invalid values', () => {
    expect(sanitizeCustomPresets(null)).toEqual([]);
    const [one] = sanitizeCustomPresets([{ name: '', settings: { outputFormat: 'bad', quality: 200, effort: 9 } }]);
    expect(one.name).toBe('Untitled preset');
    expect(one.settings.outputFormat).toBe('webp');
    expect(one.settings.quality).toBe(85);
    expect(one.settings.effort).toBe(4);
  });

  it('save creates and updates by same name', () => {
    const first = savePreset([], 'Amazon PDP', options);
    expect(first.presets).toHaveLength(1);
    const second = savePreset(first.presets, 'amazon pdp', { ...options, quality: 70 });
    expect(second.presets).toHaveLength(1);
    expect(second.presets[0].settings.quality).toBe(70);
  });

  it('rename and delete works', () => {
    const made = savePreset([], 'One', options).presets;
    const renamed = renamePreset(made, made[0].id, 'Two');
    expect(renamed[0].name).toBe('Two');
    expect(deletePreset(renamed, renamed[0].id)).toHaveLength(0);
  });

  it('settings excludes row/source specific state', () => {
    const s = settingsFromOptions({ ...options, input: '/in', output: '/out', filePaths: ['a'] });
    expect((s as any).input).toBeUndefined();
    expect((s as any).output).toBeUndefined();
    expect((s as any).filePaths).toBeUndefined();
  });

  it('built-in preset ids unchanged', () => {
    const p = normalizePresetSettings({ outputFormat: 'png', quality: 50, alphaQuality: 80, effort: 2 });
    expect(p.outputFormat).toBe('png');
  });
});
