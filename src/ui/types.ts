import type { OutputFormat } from '../types/index.js';
import type { CustomPreset } from './customPresets.js';

export interface GuiOptions {
  input?: string;
  filePaths?: string[];
  output?: string;
  prefix?: string;
  pattern: string;
  custom?: string;
  quality: number;
  alphaQuality: number;
  effort: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  recursive: boolean;
  keepMetadata: boolean;
  outputFormat?: OutputFormat;
}

export interface StoredGuiSettings extends Partial<GuiOptions> {
  outputTouched?: boolean;
  selectedPreset?: string;
  recentInputs?: string[];
  recentOutputs?: string[];
  customPresets?: CustomPreset[];
}

export interface PreviewRow {
  id: string;
  sourcePath: string;
  originalFilename: string;
  outputFilename: string;
  desiredOutputFilename?: string;
  wasRenamedForCollision?: boolean;
  collisionReason?: 'batch-duplicate' | 'existing-output-file' | 'both';
  collisionSuffix?: number;
  outputAlreadyExists?: boolean;
  originalSize: number;
  sourceFormat: string;
  targetFormat: OutputFormat;
  estimatedOutputSize?: number;
  estimatedSavedBytes?: number;
  estimatedSavedPercent?: number;
  error?: string;
  status: 'planned' | 'estimated' | 'warning' | 'failed' | 'skipped';
}

export type WorkflowPresetId = 'custom' | 'web-safe-original' | 'shopify-transparent' | 'product-listing' | 'tiny-web' | 'lossless-archive' | `custom:${string}`;
