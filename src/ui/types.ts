import type { OutputFormat } from '../types/index.js';

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

export interface PreviewRow {
  originalFilename: string;
  outputFilename: string;
  originalSize: number;
  sourceFormat: string;
  targetFormat: OutputFormat;
  status: 'planned';
}

export type WorkflowPresetId = 'custom' | 'web-safe-original' | 'shopify-transparent' | 'product-listing' | 'tiny-web' | 'lossless-archive';
