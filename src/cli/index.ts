#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { discoverFiles } from '../core/fileDiscovery.js';
import { buildRenamePlan } from '../core/rename.js';
import { processImages } from '../core/processImages.js';
import { createManifest, writeManifest } from '../core/manifest.js';
import type { CliOptions } from '../types/index.js';

async function getCliVersion(): Promise<string> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const raw = await readFile(packageJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function ensureInputFolder(inputFolder: string): Promise<void> {
  const stats = await stat(inputFolder).catch(() => null);
  if (!stats) {
    throw new Error(`Input folder does not exist: ${inputFolder}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`Input path is not a directory: ${inputFolder}`);
  }
}

function bytesToMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isSamePath(a: string, b: string): boolean {
  return path.resolve(a) === path.resolve(b);
}

function normalizeUserArgv(argv: string[]): string[] {
  if (argv.length >= 2 && !argv[0].startsWith('-') && !argv[1].startsWith('-')) {
    return argv.slice(2);
  }
  return argv;
}

export async function runCli(argv: string[]): Promise<number> {
  const version = await getCliVersion();
  const program = new Command();
  program
    .name('foxpix')
    .version(version)
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
    .exitOverride();

  program.parse(normalizeUserArgv(argv), { from: 'user' });

  const raw = program.opts();
  const inputFolder = path.resolve(raw.input);
  await ensureInputFolder(inputFolder);

  let outputFolder = raw.output ? path.resolve(raw.output) : path.join(inputFolder, 'optimized');
  if (isSamePath(outputFolder, inputFolder)) {
    outputFolder = path.join(inputFolder, 'optimized');
  }

  const options: CliOptions = {
    input: inputFolder,
    output: outputFolder,
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

  const discovered = await discoverFiles({ inputFolder, outputFolder, recursive: options.recursive });
  if (discovered.length === 0) {
    console.log('No supported image files found. Supported: .png .jpg .jpeg .webp .tiff .tif .avif');
    return 0;
  }

  const plan = await buildRenamePlan({
    files: discovered,
    outputFolder,
    pattern: options.pattern,
    prefix: options.prefix,
    custom: options.custom
  });

  console.log(options.dryRun ? 'DRY RUN MODE (no files will be written)' : 'PROCESSING MODE');
  console.log(`Input folder: ${inputFolder}`);
  console.log(`Output folder: ${outputFolder}`);
  console.log(`Discovered images: ${discovered.length}`);
  console.log(`Settings: quality=${options.quality}, alphaQuality=${options.alphaQuality}, lossless=${options.lossless}, recursive=${options.recursive}, keepMetadata=${options.keepMetadata}`);
  console.log('Planned mappings:');
  for (const item of plan) {
    console.log(`- ${item.source.relativePath} -> ${item.outputFilename}`);
  }

  if (options.dryRun) {
    console.log(`Total planned: ${plan.length}`);
    console.log('No files were written and no manifest was created.');
    return 0;
  }

  const summary = await processImages(plan, options);
  const manifest = createManifest(options, summary);
  const manifestPath = await writeManifest(outputFolder, manifest);

  console.log(`Processed: ${summary.processed}`);
  console.log(`Succeeded: ${summary.succeeded}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Total original bytes: ${summary.originalBytes} (${bytesToMb(summary.originalBytes)})`);
  console.log(`Total output bytes: ${summary.outputBytes} (${bytesToMb(summary.outputBytes)})`);
  console.log(`Total saved bytes: ${summary.savedBytes} (${bytesToMb(summary.savedBytes)})`);
  console.log(`Saved: ${summary.savedPercent}%`);
  console.log(`Manifest: ${manifestPath}`);

  if (summary.failed > 0) {
    console.log('Command completed with failures. Exiting with status code 1 for automation safety.');
    console.log('Failures:');
    for (const file of summary.files.filter((f) => f.status === 'failed')) {
      console.log(`- ${file.originalFilename}: ${file.error}`);
    }
    return 1;
  }

  return 0;
}

async function main(): Promise<void> {
  try {
    process.exitCode = await runCli(process.argv.slice(2));
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode;
      return;
    }

    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
