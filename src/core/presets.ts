import type { GuiOptions } from '../ui/types.js';

export type WorkflowPresetId = 'custom' | 'web-safe-original' | 'shopify-transparent' | 'product-listing' | 'tiny-web' | 'lossless-archive';

export const workflowPresets: Record<Exclude<WorkflowPresetId, 'custom'>, Partial<GuiOptions>> = {
  'web-safe-original': { pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, keepMetadata: false },
  'shopify-transparent': { pattern: '{name}', quality: 90, alphaQuality: 100, lossless: false, keepMetadata: false },
  'product-listing': { pattern: '{prefix}-{index}', quality: 88, alphaQuality: 100, lossless: false, keepMetadata: false },
  'tiny-web': { pattern: '{name}', quality: 75, alphaQuality: 95, lossless: false, keepMetadata: false },
  'lossless-archive': { pattern: '{name}', lossless: true, alphaQuality: 100, keepMetadata: true }
};
