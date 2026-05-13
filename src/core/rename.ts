import path from 'node:path';
import { access } from 'node:fs/promises';
import { slugify } from './slugify.js';
import { normalizeOutputFormat, type DiscoveredFile, type RenamePlanItem, type OutputFormat } from '../types/index.js';
import { extensionForOutputFormat } from './outputFormat.js';

export interface RenameOptions {
  files: DiscoveredFile[];
  outputFolder: string;
  pattern: string;
  prefix?: string;
  custom?: string;
  outputFormat?: OutputFormat;
  formatOverrides?: Record<string, OutputFormat>;
}

function withPadding(index: number): string {
  return String(index).padStart(3, '0');
}

function slugifyOptional(value?: string): string {
  if (!value || value.trim().length === 0) {
    return '';
  }
  const hasMeaningfulChars = /[a-z0-9]/i.test(value.normalize('NFKD'));
  if (!hasMeaningfulChars) {
    return '';
  }

  return slugify(value);
}

function createBaseName(file: DiscoveredFile, index: number, pattern: string, prefix?: string, custom?: string): string {
  const basePrefix = slugifyOptional(prefix) || slugify(file.name || 'image');
  const baseName = slugify(file.name || 'image');
  const resolved = pattern
    .replaceAll('{index}', withPadding(index))
    .replaceAll('{name}', baseName)
    .replaceAll('{prefix}', basePrefix)
    .replaceAll('{folder}', file.folderName)
    .replaceAll('{custom}', slugifyOptional(custom));

  const hasMeaningfulChars = /[a-z0-9]/i.test(resolved.normalize('NFKD'));
  if (!hasMeaningfulChars) {
    return `image-${withPadding(index)}`;
  }

  return slugify(resolved);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function buildRenamePlan(options: RenameOptions): Promise<RenamePlanItem[]> {
  const used = new Set<string>();
  const plan: RenamePlanItem[] = [];

  for (const [i, file] of options.files.entries()) {
    const initial = createBaseName(file, i + 1, options.pattern, options.prefix, options.custom);
    let attempt = 1;
    const outputFormat = normalizeOutputFormat(options.formatOverrides?.[file.absolutePath] ?? options.outputFormat);
    const ext = extensionForOutputFormat(outputFormat);
    const desiredFilename = `${initial}.${ext}`;
    let filename = desiredFilename;
    let hadBatchDuplicate = false;
    let hadExistingOutput = false;

    while (used.has(filename) || (await fileExists(path.join(options.outputFolder, filename)))) {
      if (used.has(filename)) hadBatchDuplicate = true;
      if (await fileExists(path.join(options.outputFolder, filename))) hadExistingOutput = true;
      attempt += 1;
      filename = `${initial}-${attempt}.${ext}`;
    }

    used.add(filename);
    const reason = hadBatchDuplicate && hadExistingOutput ? 'both' : hadBatchDuplicate ? 'batch-duplicate' : hadExistingOutput ? 'existing-output-file' : undefined;
    plan.push({ source: file, desiredOutputFilename: desiredFilename, outputFilename: filename, outputPath: path.join(options.outputFolder, filename), outputFormat, wasRenamedForCollision: filename !== desiredFilename, collisionReason: reason, collisionSuffix: filename !== desiredFilename ? attempt : undefined, outputAlreadyExists: hadExistingOutput });
  }

  return plan;
}
