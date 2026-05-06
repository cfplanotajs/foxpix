import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { discoverFilesFromPaths } from '../src/core/fileDiscovery.js';

describe('discoverFilesFromPaths', () => {
  it('discovers a valid image file path', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-paths-'));
    const image = path.join(dir, 'Animal Name.png');
    await sharp({ create: { width: 10, height: 10, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } } }).png().toFile(image);
    const discovered = await discoverFilesFromPaths([image]);
    expect(discovered).toHaveLength(1);
    expect(discovered[0].name).toBe('Animal Name');
  });

  it('ignores unsupported files safely', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-paths-'));
    const txt = path.join(dir, 'notes.txt');
    await writeFile(txt, 'hello');
    const discovered = await discoverFilesFromPaths([txt]);
    expect(discovered).toHaveLength(0);
  });
});
