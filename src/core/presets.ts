import type { GuiOptions } from '../ui/types.js';

export type WorkflowPresetId = 'custom' | 'web-safe-original' | 'shopify-transparent' | 'product-listing' | 'tiny-web' | 'lossless-archive';

export const workflowPresets: Record<Exclude<WorkflowPresetId, 'custom'>, Partial<GuiOptions>> = {
  'web-safe-original': { pattern: '{name}', quality: 85, alphaQuality: 100, effort: 4, lossless: false, keepMetadata: false, outputFormat: 'webp' },
  'shopify-transparent': { pattern: '{name}', quality: 90, alphaQuality: 100, effort: 5, lossless: false, keepMetadata: false, outputFormat: 'webp' },
  'product-listing': { pattern: '{prefix}-{index}', quality: 88, alphaQuality: 100, effort: 4, lossless: false, keepMetadata: false, outputFormat: 'webp' },
  'tiny-web': { pattern: '{name}', quality: 75, alphaQuality: 95, effort: 5, lossless: false, keepMetadata: false, outputFormat: 'webp' },
  'lossless-archive': { pattern: '{name}', lossless: true, alphaQuality: 100, effort: 6, keepMetadata: true, outputFormat: 'webp' }
};
