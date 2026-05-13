import path from 'node:path';
import type { DiscoveredFile } from '../types/index.js';

export function buildIncludedPathSet(includedPaths?: string[]): Set<string> | null {
  if (!includedPaths) return null;
  return new Set(includedPaths.map((p) => path.resolve(p)));
}

export function filterDiscoveredFilesByIncludedPaths(discovered: DiscoveredFile[], includedPaths?: string[]): DiscoveredFile[] {
  const set = buildIncludedPathSet(includedPaths);
  if (!set) return discovered;
  return discovered.filter((f) => set.has(path.resolve(f.absolutePath)));
}
