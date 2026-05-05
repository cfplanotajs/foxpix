import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { slugify } from './slugify.js';
import type { DiscoveredFile } from '../types/index.js';

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.avif']);

export interface DiscoverOptions {
  inputFolder: string;
  recursive: boolean;
  outputFolder?: string;
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function isSameOrSubPath(parent: string, target: string): boolean {
  const relative = path.relative(parent, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function discoverFiles(options: DiscoverOptions): Promise<DiscoveredFile[]> {
  const inputFolder = path.resolve(options.inputFolder);
  const outputFolder = options.outputFolder ? path.resolve(options.outputFolder) : undefined;
  const shouldExcludeOutputFolder = outputFolder ? isSameOrSubPath(inputFolder, outputFolder) : false;
  const files: DiscoveredFile[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (outputFolder && shouldExcludeOutputFolder && isSameOrSubPath(outputFolder, absolutePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (options.recursive) {
          await walk(absolutePath);
        }
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(extension)) {
        continue;
      }

      const relativePath = path.relative(inputFolder, absolutePath);
      files.push({
        absolutePath,
        relativePath,
        name: path.basename(entry.name, extension),
        extension,
        folderName: slugify(path.basename(path.dirname(absolutePath)))
      });
    }
  }

  await walk(inputFolder);
  return files.sort((a, b) => naturalSort(a.relativePath, b.relativePath));
}
