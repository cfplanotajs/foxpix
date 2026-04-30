import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { processImages } from '../src/core/processImages.js';
import type { CliOptions, DiscoveredFile, RenamePlanItem } from '../src/types/index.js';

async function createTransparentPng(filePath: string): Promise<void> {
  await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: Buffer.from('<svg><rect x="8" y="8" width="48" height="48" fill="#ff00aa"/></svg>') }])
    .png()
    .toFile(filePath);
}

describe('processImages integration', () => {
  it('converts transparent png to webp and preserves alpha', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-int-'));
    const inputFile = path.join(dir, 'alpha.png');
    const outputDir = path.join(dir, 'optimized');
    const outputFile = path.join(outputDir, 'alpha-001.webp');

    await createTransparentPng(inputFile);
    const beforeSource = await readFile(inputFile);

    const discovered: DiscoveredFile = {
      absolutePath: inputFile,
      relativePath: 'alpha.png',
      name: 'alpha',
      extension: '.png',
      folderName: 'input'
    };

    const plan: RenamePlanItem[] = [{ source: discovered, outputFilename: 'alpha-001.webp', outputPath: outputFile }];
    const options: CliOptions = {
      input: dir,
      output: outputDir,
      prefix: 'alpha',
      pattern: '{prefix}-{index}',
      quality: 85,
      alphaQuality: 100,
      lossless: false,
      recursive: false,
      dryRun: false,
      keepMetadata: false
    };

    const summary = await processImages(plan, options);
    expect(existsSync(outputFile)).toBe(true);

    const outputMeta = await sharp(outputFile).metadata();
    expect(outputMeta.format).toBe('webp');
    expect(outputMeta.hasAlpha).toBe(true);

    const afterSource = await readFile(inputFile);
    expect(afterSource.equals(beforeSource)).toBe(true);

    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(0);
    expect(summary.files[0].status).toBe('success');
    expect((await stat(inputFile)).mtimeMs).toBeGreaterThan(0);
  });
});
