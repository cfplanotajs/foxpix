import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveDroppedItems } from '../src/electron/droppedItems.js';

describe('resolveDroppedItems', () => {
  it('returns files result for multiple supported files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-drop-'));
    const a = path.join(dir, 'a.png');
    const b = path.join(dir, 'b.jpg');
    await writeFile(a, 'x');
    await writeFile(b, 'x');
    const result = await resolveDroppedItems([a, b]);
    expect(result.kind).toBe('files');
  });

  it('rejects unsupported files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-drop-'));
    const a = path.join(dir, 'a.txt');
    await writeFile(a, 'x');
    const result = await resolveDroppedItems([a]);
    expect(result.kind).toBe('invalid');
  });

  it('rejects mixed folder and files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-drop-'));
    const folder = path.join(dir, 'folder');
    await mkdir(folder);
    const a = path.join(dir, 'a.png');
    await writeFile(a, 'x');
    const result = await resolveDroppedItems([folder, a]);
    expect(result.kind).toBe('invalid');
  });
});
