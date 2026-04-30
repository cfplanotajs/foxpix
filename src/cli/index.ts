#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { discoverFiles } from '../core/fileDiscovery.js';
import { buildRenamePlan } from '../core/rename.js';
import { processImages } from '../core/processImages.js';
import { createManifest, writeManifest } from '../core/manifest.js';
import type { CliOptions } from '../types/index.js';

async function ensureInputFolder(input: string): Promise<void> {
  try {
    const stats = await stat(input);
    if (!stats.isDirectory()) {
      throw new Error(`Input path is not a directory: ${input}`);
    }
  } catch {
    throw new Error(`Input folder does not exist: ${input}`);
  }
}

function bytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('foxpix')
    .description('Local batch image optimizer for web workflows')
    .requiredOption('--input <path>', 'Input folder containing source images')
    .option('--output <path>', 'Output folder (default: <input>/optimized)')
    .option('--prefix <text>', 'Prefix token value')
    .option('--pattern <pattern>', 'Filename pattern', '{prefix}-{index}')
    .option('--custom <text>', 'Custom token value for {custom}')
    .option('--quality <number>', 'WebP quality (default: 85)', (v) => Number(v), 85)
    .option('--alphaQuality <number>', 'WebP alpha quality (default: 100)', (v) => Number(v), 100)
    .option('--lossless', 'Enable lossless WebP', false)
    .option('--maxWidth <number>', 'Resize max width', (v) => Number(v))
    .option('--maxHeight <number>', 'Resize max height', (v) => Number(v))
    .option('--recursive', 'Recursively discover files', false)
    .option('--dryRun', 'Print planned mappings only', false)
    .option('--keepMetadata', 'Preserve metadata in output files', false)
    .parse(process.argv);

  const raw = program.opts();
  const input = path.resolve(raw.input);
  const output = path.resolve(raw.output || path.join(input, 'optimized'));

  const options: CliOptions = {
    input,
    output,
    prefix: raw.prefix,
    pattern: raw.pattern,
    custom: raw.custom,
    quality: raw.quality,
    alphaQuality: raw.alphaQuality,
    lossless: Boolean(raw.lossless),
    maxWidth: raw.maxWidth,
    maxHeight: raw.maxHeight,
    recursive: Boolean(raw.recursive),
    dryRun: Boolean(raw.dryRun),
    keepMetadata: Boolean(raw.keepMetadata)
  };

  await ensureInputFolder(options.input);

  const discovered = await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive });
  if (discovered.length === 0) {
    console.log('No supported image files found. Supported: .png .jpg .jpeg .webp .tiff .tif .avif');
    process.exit(0);
  }

  const plan = await buildRenamePlan({
    files: discovered,
    outputFolder: options.output,
    pattern: options.pattern,
    prefix: options.prefix,
    custom: options.custom
  });

  console.log(options.dryRun ? 'DRY RUN: Planned output mapping' : 'Processing images');
  console.log(`Input folder: ${options.input}`);
  console.log(`Output folder: ${options.output}`);
  console.log(`Discovered images: ${discovered.length}`);
  console.log(`Settings: quality=${options.quality}, alphaQuality=${options.alphaQuality}, lossless=${options.lossless}, recursive=${options.recursive}, keepMetadata=${options.keepMetadata}`);

  for (const item of plan) {
    console.log(`${item.source.relativePath} -> ${item.outputFilename}`);
  }

  if (options.dryRun) {
    console.log(`Total files: ${plan.length}`);
    console.log('No files were written.');
    return;
  }

  const summary = await processImages(plan, options);
  const manifest = createManifest(options, summary);
  const manifestPath = await writeManifest(options.output, manifest);

  console.log(`Succeeded: ${summary.succeeded}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Total before: ${bytesToMb(summary.originalBytes)}`);
  console.log(`Total after: ${bytesToMb(summary.outputBytes)}`);
  console.log(`Saved: ${summary.savedPercent}%`);
  console.log(`Manifest: ${manifestPath}`);

  if (summary.failed > 0) {
    console.log('Some files failed:');
    for (const file of summary.files.filter((f) => f.status === 'failed')) {
      console.log(`- ${file.originalFilename}: ${file.error}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
