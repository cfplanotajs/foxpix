import path from 'node:path';
import { normalizeOutputFormat, type CliOptions } from '../types/index.js';
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
  outputFormat?: CliOptions['outputFormat'];
}

export function normalizeOptions(options: GuiOptionsLike): CliOptions {
  const hasFiles = Array.isArray(options.filePaths) && options.filePaths.length > 0;
  const selectedParentDirs = hasFiles
    ? Array.from(new Set((options.filePaths ?? []).map((filePath) => path.dirname(path.resolve(filePath)))))
    : [];
  const baseInput = hasFiles
    ? selectedParentDirs[0] ?? path.resolve('.')
    : path.resolve(options.input ?? '.');
  const resolvedOutput = options.output ? path.resolve(options.output) : path.join(baseInput, 'optimized');

  const outputConflictsWithSource = hasFiles
    ? selectedParentDirs.some((sourceParentDir) => samePhysicalPath(resolvedOutput, sourceParentDir))
    : samePhysicalPath(resolvedOutput, baseInput);

  const output = outputConflictsWithSource ? path.join(baseInput, 'optimized') : resolvedOutput;

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
    keepMetadata: options.keepMetadata,
    outputFormat: normalizeOutputFormat(options.outputFormat)
  };
}
