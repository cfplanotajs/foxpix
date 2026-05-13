#!/usr/bin/env node
import { Command, CommanderError, InvalidArgumentError } from 'commander';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, readFile, stat } from 'node:fs/promises';
import { discoverFiles } from '../core/fileDiscovery.js';
import { buildRenamePlan } from '../core/rename.js';
import { processImages } from '../core/processImages.js';
import { createManifest, writeManifest } from '../core/manifest.js';
import { writeManifestCsv } from '../core/manifestCsv.js';
import { normalizeOutputFormat, type CliOptions } from '../types/index.js';
import { safeRealpath, samePhysicalPath } from '../core/pathSafety.js';
import { getOutputFolderStatus } from '../core/outputFolderStatus.js';

async function findPackageJsonPath(startDir: string): Promise<string | null> {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, 'package.json');
    try {
      await access(candidate);
      return candidate;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        return null;
      }
      current = parent;
    }
  }
}

async function getCliVersion(): Promise<string> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJsonPath = await findPackageJsonPath(__dirname);
    if (!packageJsonPath) {
      return '0.0.0';
    }

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

function parseIntegerOption(value: string, optionName: string): number {
  const num = Number(value);
  if (!Number.isInteger(num)) {
    throw new InvalidArgumentError(`${optionName} must be an integer.`);
  }
  return num;
}

function parseRangeOption(value: string, optionName: string, min: number, max: number): number {
  const num = parseIntegerOption(value, optionName);
  if (num < min || num > max) {
    throw new InvalidArgumentError(`${optionName} must be between ${min} and ${max}.`);
  }
  return num;
}

function parsePositiveIntegerOption(value: string, optionName: string): number {
  const num = parseIntegerOption(value, optionName);
  if (num <= 0) {
    throw new InvalidArgumentError(`${optionName} must be greater than 0.`);
  }
  return num;
}

export async function runCli(argv: string[]): Promise<number> {
  try {
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
      .option('--quality <number>', 'WebP quality (default: 85)', (v) => parseRangeOption(v, '--quality', 1, 100), 85)
      .option('--alphaQuality <number>', 'WebP alpha quality (default: 100)', (v) => parseRangeOption(v, '--alphaQuality', 0, 100), 100)
      .option('--effort <number>', 'WebP effort 0–6 (0 fastest, 6 smallest/slowest; default: 4)', (v) => parseRangeOption(v, '--effort', 0, 6), 4)
      .option('--lossless', 'Enable lossless WebP', false)
      .option('--maxWidth <number>', 'Resize max width', (v) => parsePositiveIntegerOption(v, '--maxWidth'))
      .option('--maxHeight <number>', 'Resize max height', (v) => parsePositiveIntegerOption(v, '--maxHeight'))
      .option('--recursive', 'Recursively discover files', false)
      .option('--dryRun', 'Print planned mappings only', false)
      .option('--keepMetadata', 'Preserve metadata in output files', false)
      .option('--format <format>', 'Output format: webp, avif, jpeg, png (default: webp)', 'webp')
      .allowExcessArguments(false)
      .exitOverride();

    program.parse(argv, { from: 'user' });

    const raw = program.opts();
    const inputFolder = path.resolve(raw.input);
    await ensureInputFolder(inputFolder);

    let outputFolder = raw.output ? path.resolve(raw.output) : path.join(inputFolder, 'optimized');
    if (samePhysicalPath(outputFolder, inputFolder)) {
      outputFolder = path.join(inputFolder, 'optimized');
    }

    const normalizedFormat = normalizeOutputFormat(raw.format);
    if (String(raw.format).toLowerCase() !== normalizedFormat && String(raw.format).toLowerCase() !== 'webp') {
      throw new Error('Unsupported format. Use webp, avif, jpeg, or png.');
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
      effort: raw.effort,
      maxWidth: raw.maxWidth,
      maxHeight: raw.maxHeight,
      recursive: Boolean(raw.recursive),
      dryRun: Boolean(raw.dryRun),
      keepMetadata: Boolean(raw.keepMetadata),
      outputFormat: normalizedFormat
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
      custom: options.custom,
      outputFormat: options.outputFormat
    });

    console.log(options.dryRun ? 'DRY RUN MODE (no files will be written)' : 'PROCESSING MODE');
    console.log(`Input folder: ${inputFolder}`);
    console.log(`Output folder: ${outputFolder}`);
    console.log(`Discovered images: ${discovered.length}`);
    console.log(`Settings: format=${options.outputFormat}, quality=${options.quality}, alphaQuality=${options.alphaQuality}, effort=${options.effort}, lossless=${options.lossless}, recursive=${options.recursive}, keepMetadata=${options.keepMetadata}`);
    console.log('Planned mappings:');
    for (const item of plan) {
      console.log(`- ${item.source.relativePath} -> ${item.outputFilename}`);
    }

    if (options.dryRun) {
      const renamedCount = plan.filter((p) => p.wasRenamedForCollision).length;
      if (renamedCount > 0) {
        console.log(`${renamedCount} output names adjusted to avoid collisions.`);
      }
      console.log(`Total planned: ${plan.length}`);
      console.log('No files were written and no manifest was created.');
      return 0;
    }
    const folderStatus = await getOutputFolderStatus(outputFolder);
    if (folderStatus.status === 'not-directory') throw new Error('Output path is not a folder. Choose another output location.');
    if (folderStatus.status === 'not-accessible') throw new Error('Output folder cannot be accessed. Choose another output location.');

    const summary = await processImages(plan, options);
    const manifest = createManifest(options, summary);
    const manifestPath = await writeManifest(outputFolder, manifest);
    const manifestCsvPath = await writeManifestCsv(outputFolder, summary.files);

    console.log(`Processed: ${summary.processed}`);
    console.log(`Succeeded: ${summary.succeeded}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Total original bytes: ${summary.originalBytes} (${bytesToMb(summary.originalBytes)})`);
    console.log(`Total output bytes: ${summary.outputBytes} (${bytesToMb(summary.outputBytes)})`);
    console.log(`Total saved bytes: ${summary.savedBytes} (${bytesToMb(summary.savedBytes)})`);
    console.log(`Saved: ${summary.savedPercent}%`);
    console.log(`Manifest JSON: ${manifestPath}`);
    console.log(`Manifest CSV: ${manifestCsvPath}`);
    const renamedCount = plan.filter((p) => p.wasRenamedForCollision).length;
    if (renamedCount > 0) console.log(`Output names adjusted for safety: ${renamedCount}`);

    if (summary.failed > 0) {
      console.log('Command completed with failures. Exiting with status code 1 for automation safety.');
      console.log('Failures:');
      for (const file of summary.files.filter((f) => f.status === 'failed')) {
        console.log(`- ${file.originalFilename}: ${file.error}`);
      }
      return 1;
    }

    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

export async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv.slice(2));
}

function isDirectRun(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  const invoked = safeRealpath(process.argv[1]);
  const currentFile = safeRealpath(fileURLToPath(import.meta.url));
  return invoked === currentFile;
}

if (isDirectRun()) {
  void main();
}
