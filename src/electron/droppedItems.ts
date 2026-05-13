import { stat } from 'node:fs/promises';
import path from 'node:path';

const SUPPORTED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.avif']);

export type DroppedItemsResult =
  | { kind: 'folder'; path: string }
  | { kind: 'files'; paths: string[] }
  | { kind: 'invalid'; error: string };

export async function resolveDroppedItems(paths: string[]): Promise<DroppedItemsResult> {
  const resolved = paths.filter(Boolean).map((p) => path.resolve(p));
  if (resolved.length === 0) return { kind: 'invalid', error: 'Please drop a folder or supported image files.' };

  const dirs: string[] = [];
  const files: string[] = [];

  for (const p of resolved) {
    const info = await stat(p).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) dirs.push(p);
    else if (info.isFile()) files.push(p);
  }

  if (dirs.length > 1) return { kind: 'invalid', error: 'Please drop one folder at a time.' };
  if (dirs.length === 1 && files.length > 0) return { kind: 'invalid', error: 'Drop either one folder or supported image files, not both.' };
  if (dirs.length === 1) return { kind: 'folder', path: dirs[0] };

  const supported = files.filter((p) => SUPPORTED.has(path.extname(p).toLowerCase()));
  if (supported.length === 0) return { kind: 'invalid', error: 'Please drop a folder or supported image files.' };
  if (supported.length !== files.length) return { kind: 'invalid', error: 'Some dropped files are not supported.' };
  return { kind: 'files', paths: supported };
}
