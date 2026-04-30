import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { discoverFiles } from '../src/core/fileDiscovery.js';

describe('file discovery output-folder exclusion', () => {
  it('excludes only true output descendants, not sibling prefix folders', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-discovery-'));
    const inputDir = path.join(root, 'input');
    const optimizedDir = path.join(inputDir, 'optimized');
    const optimizedOldDir = path.join(inputDir, 'optimized-old');

    await mkdir(optimizedDir, { recursive: true });
    await mkdir(optimizedOldDir, { recursive: true });

    await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: 10, g: 20, b: 30 } } })
      .png()
      .toFile(path.join(optimizedDir, 'skip.png'));

    await sharp({ create: { width: 16, height: 16, channels: 3, background: { r: 40, g: 50, b: 60 } } })
      .png()
      .toFile(path.join(optimizedOldDir, 'keep.png'));

    const discovered = await discoverFiles({
      inputFolder: inputDir,
      outputFolder: optimizedDir,
      recursive: true
    });

    const files = discovered.map((file) => file.relativePath);
    expect(files).not.toContain(path.join('optimized', 'skip.png'));
    expect(files).toContain(path.join('optimized-old', 'keep.png'));
  });

  it('does not exclude input files when output folder is an ancestor of input', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-discovery-ancestor-'));
    const outputDir = path.join(root, 'images');
    const inputDir = path.join(outputDir, 'raw');
    await mkdir(inputDir, { recursive: true });

    await sharp({ create: { width: 20, height: 10, channels: 3, background: { r: 10, g: 90, b: 140 } } })
      .jpeg()
      .toFile(path.join(inputDir, 'photo.jpg'));

    const discovered = await discoverFiles({
      inputFolder: inputDir,
      outputFolder: outputDir,
      recursive: true
    });

    expect(discovered.length).toBe(1);
    expect(discovered[0].relativePath).toBe('photo.jpg');
  });
});
