import path from 'node:path';
import { realpathSync } from 'node:fs';

export function safeRealpath(filePath: string): string {
  try {
    return realpathSync.native(filePath);
  } catch {
    try {
      return realpathSync(filePath);
    } catch {
      return path.resolve(filePath);
    }
  }
}

export function normalizePathForComparison(filePath: string): string {
  const normalized = path.normalize(filePath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function samePhysicalPath(a: string, b: string): boolean {
  return normalizePathForComparison(safeRealpath(a)) === normalizePathForComparison(safeRealpath(b));
}
