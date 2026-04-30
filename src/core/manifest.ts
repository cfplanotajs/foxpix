import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CliOptions, Manifest, ProcessingSummary } from '../types/index.js';

export function createManifest(options: CliOptions, summary: ProcessingSummary): Manifest {
  return {
    generatedAt: new Date().toISOString(),
    inputFolder: options.input,
    outputFolder: options.output,
    settings: {
      prefix: options.prefix,
      pattern: options.pattern,
      custom: options.custom,
      quality: options.quality,
      alphaQuality: options.alphaQuality,
      lossless: options.lossless,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      recursive: options.recursive,
      keepMetadata: options.keepMetadata
    },
    totals: {
      discovered: summary.discovered,
      processed: summary.processed,
      succeeded: summary.succeeded,
      failed: summary.failed,
      originalBytes: summary.originalBytes,
      outputBytes: summary.outputBytes,
      savedBytes: summary.savedBytes,
      savedPercent: summary.savedPercent
    },
    files: summary.files
  };
}

export async function writeManifest(outputFolder: string, manifest: Manifest): Promise<string> {
  const manifestPath = path.join(outputFolder, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifestPath;
}
