import path from 'node:path';
import { access } from 'node:fs/promises';
import { slugify } from './slugify.js';
import type { DiscoveredFile, RenamePlanItem } from '../types/index.js';

export interface RenameOptions {
  files: DiscoveredFile[];
  outputFolder: string;
  pattern: string;
  prefix?: string;
  custom?: string;
}

function withPadding(index: number): string {
  return String(index).padStart(3, '0');
}

function createBaseName(file: DiscoveredFile, index: number, pattern: string, prefix?: string, custom?: string): string {
  const basePrefix = slugify(prefix || file.name || 'image');
  const baseName = slugify(file.name);
  const resolved = pattern
    .replaceAll('{index}', withPadding(index))
    .replaceAll('{name}', baseName)
    .replaceAll('{prefix}', basePrefix)
    .replaceAll('{folder}', file.folderName)
    .replaceAll('{custom}', slugify(custom || ''));

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
    let filename = `${initial}.webp`;

    while (
      used.has(filename) ||
      (await fileExists(path.join(options.outputFolder, filename)))
    ) {
      attempt += 1;
      filename = `${initial}-${attempt}.webp`;
    }

    used.add(filename);
    plan.push({ source: file, outputFilename: filename, outputPath: path.join(options.outputFolder, filename) });
  }

  return plan;
}
