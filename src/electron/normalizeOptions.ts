import path from 'node:path';
import type { CliOptions } from '../types/index.js';
import { samePhysicalPath } from '../core/pathSafety.js';

export interface GuiOptionsLike {
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
}

export function normalizeOptions(options: GuiOptionsLike): CliOptions {
  const hasFiles = Array.isArray(options.filePaths) && options.filePaths.length > 0;
  const baseInput = hasFiles
    ? path.dirname(path.resolve(options.filePaths?.[0] ?? '.'))
    : path.resolve(options.input ?? '.');
  const resolvedOutput = options.output ? path.resolve(options.output) : path.join(baseInput, 'optimized');
  const output = samePhysicalPath(resolvedOutput, baseInput) ? path.join(baseInput, 'optimized') : resolvedOutput;

  return {
    input: baseInput,
    output,
    prefix: options.prefix,
    pattern: options.pattern,
    custom: options.custom,
    quality: options.quality,
    alphaQuality: options.alphaQuality,
    lossless: options.lossless,
    effort: Number.isInteger(options.effort) && options.effort >= 0 && options.effort <= 6 ? options.effort : 4,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    recursive: options.recursive,
    dryRun: false,
    keepMetadata: options.keepMetadata
  };
}
