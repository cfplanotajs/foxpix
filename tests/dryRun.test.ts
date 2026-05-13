import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { discoverFiles } from '../src/core/fileDiscovery.js';
import { buildRenamePlan } from '../src/core/rename.js';

describe('dry run planning behavior', () => {
  it('discovers and plans without creating output folder or files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-dry-'));
    const inputDir = path.join(dir, 'input');
    const outputDir = path.join(inputDir, 'optimized');

    await mkdir(inputDir, { recursive: true });

    await sharp({
      create: {
        width: 30,
        height: 30,
        channels: 3,
        background: { r: 10, g: 10, b: 10 }
      }
    }).png().toFile(path.join(inputDir, 'one.png'));

    const discovered = await discoverFiles({ inputFolder: inputDir, recursive: false, outputFolder: outputDir });
    const plan = await buildRenamePlan({ files: discovered, outputFolder: outputDir, pattern: '{prefix}-{index}', prefix: 'test' });

    expect(discovered.length).toBe(1);
    expect(plan.length).toBe(1);
    expect(plan[0].outputFilename).toBe('test-001.webp');
    expect(existsSync(outputDir)).toBe(false);
    expect(existsSync(path.join(outputDir, 'manifest.json'))).toBe(false);
    expect(existsSync(path.join(outputDir, 'test-001.webp'))).toBe(false);
  });
});
