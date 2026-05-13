import { normalizeOutputFormat, type OutputFormat } from '../types/index.js';
import type { GuiOptions } from './types.js';

export type CustomPresetSettings = {
  outputFormat: OutputFormat;
  pattern: string;
  prefix?: string;
  custom?: string;
  quality: number;
  alphaQuality: number;
  effort: number;
  maxWidth?: number;
  maxHeight?: number;
  lossless: boolean;
  keepMetadata: boolean;
  recursive: boolean;
};

export type CustomPreset = { id: string; name: string; createdAt: string; updatedAt: string; settings: CustomPresetSettings };

const defaults: CustomPresetSettings = { outputFormat: 'webp', pattern: '{name}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, keepMetadata: false, recursive: false };
const toInt = (v: unknown, d: number, min: number, max: number): number => Number.isInteger(v) && Number(v) >= min && Number(v) <= max ? Number(v) : d;
const toPosInt = (v: unknown): number | undefined => Number.isInteger(v) && Number(v) > 0 ? Number(v) : undefined;

export function normalizePresetSettings(input: Partial<CustomPresetSettings> | undefined): CustomPresetSettings {
  return {
    outputFormat: normalizeOutputFormat(input?.outputFormat),
    pattern: typeof input?.pattern === 'string' && input.pattern.trim() ? input.pattern : defaults.pattern,
    prefix: typeof input?.prefix === 'string' ? input.prefix : undefined,
    custom: typeof input?.custom === 'string' ? input.custom : undefined,
    quality: toInt(input?.quality, 85, 1, 100),
    alphaQuality: toInt(input?.alphaQuality, 100, 0, 100),
    effort: toInt(input?.effort, 4, 0, 6),
    maxWidth: toPosInt(input?.maxWidth),
    maxHeight: toPosInt(input?.maxHeight),
    lossless: Boolean(input?.lossless),
    keepMetadata: Boolean(input?.keepMetadata),
    recursive: Boolean(input?.recursive)
  };
}

export function sanitizeCustomPresets(input: unknown): CustomPreset[] {
  if (!Array.isArray(input)) return [];
  return input.map((item, idx) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    return {
      id: typeof row.id === 'string' && row.id ? row.id : `preset-${idx + 1}`,
      name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Untitled preset',
      createdAt: typeof row.createdAt === 'string' && row.createdAt ? row.createdAt : now,
      updatedAt: typeof row.updatedAt === 'string' && row.updatedAt ? row.updatedAt : now,
      settings: normalizePresetSettings(row.settings as Partial<CustomPresetSettings>)
    };
  });
}

export function settingsFromOptions(options: GuiOptions): CustomPresetSettings {
  return normalizePresetSettings(options as Partial<CustomPresetSettings>);
}

export function savePreset(list: CustomPreset[], name: string, options: GuiOptions): { presets: CustomPreset[]; saved: CustomPreset } {
  const trimmed = name.trim() || 'Untitled preset';
  const now = new Date().toISOString();
  const found = list.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (found) {
    const updated = { ...found, name: trimmed, updatedAt: now, settings: settingsFromOptions(options) };
    return { presets: list.map((p) => p.id === found.id ? updated : p), saved: updated };
  }
  const created = { id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: trimmed, createdAt: now, updatedAt: now, settings: settingsFromOptions(options) };
  return { presets: [...list, created], saved: created };
}

export function renamePreset(list: CustomPreset[], id: string, name: string): CustomPreset[] {
  const nextName = name.trim() || 'Untitled preset';
  return list.map((p) => p.id === id ? { ...p, name: nextName, updatedAt: new Date().toISOString() } : p);
}

export function deletePreset(list: CustomPreset[], id: string): CustomPreset[] { return list.filter((p) => p.id !== id); }
