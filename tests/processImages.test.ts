import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
  it('converts transparent png to webp and preserves alpha without mutating source', async () => {
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
  });

  it('reports final output dimensions after resize', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-resize-'));
    const inputFile = path.join(dir, 'wide.png');
    const outputDir = path.join(dir, 'optimized');
    const outputFile = path.join(outputDir, 'wide-001.webp');

    await sharp({
      create: {
        width: 100,
        height: 50,
        channels: 4,
        background: { r: 120, g: 40, b: 200, alpha: 1 }
      }
    }).png().toFile(inputFile);

    const discovered: DiscoveredFile = {
      absolutePath: inputFile,
      relativePath: 'wide.png',
      name: 'wide',
      extension: '.png',
      folderName: 'input'
    };

    const plan: RenamePlanItem[] = [{ source: discovered, outputFilename: 'wide-001.webp', outputPath: outputFile }];
    const options: CliOptions = {
      input: dir,
      output: outputDir,
      prefix: 'wide',
      pattern: '{prefix}-{index}',
      quality: 85,
      alphaQuality: 100,
      lossless: false,
      maxWidth: 25,
      recursive: false,
      dryRun: false,
      keepMetadata: false
    };

    const summary = await processImages(plan, options);
    expect(summary.files[0].status).toBe('success');
    expect(summary.files[0].width).toBe(25);
    expect(summary.files[0].height).toBe(13);
  });

  it('accounts original bytes for mixed success and failed files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-mixed-'));
    const inputGood = path.join(dir, 'good.png');
    const inputBad = path.join(dir, 'bad.png');
    const outputDir = path.join(dir, 'optimized');

    await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 4,
        background: { r: 200, g: 50, b: 40, alpha: 1 }
      }
    }).png().toFile(inputGood);

    await writeFile(inputBad, 'invalid-image-content', 'utf8');

    const files: DiscoveredFile[] = [
      { absolutePath: inputGood, relativePath: 'good.png', name: 'good', extension: '.png', folderName: 'input' },
      { absolutePath: inputBad, relativePath: 'bad.png', name: 'bad', extension: '.png', folderName: 'input' }
    ];

    const plan: RenamePlanItem[] = [
      { source: files[0], outputFilename: 'good-001.webp', outputPath: path.join(outputDir, 'good-001.webp') },
      { source: files[1], outputFilename: 'bad-002.webp', outputPath: path.join(outputDir, 'bad-002.webp') }
    ];

    const options: CliOptions = {
      input: dir,
      output: outputDir,
      prefix: 'mixed',
      pattern: '{prefix}-{index}',
      quality: 85,
      alphaQuality: 100,
      lossless: false,
      recursive: false,
      dryRun: false,
      keepMetadata: false
    };

    const summary = await processImages(plan, options);

    expect(summary.processed).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);

    const failedItem = summary.files.find((f) => f.status === 'failed');
    expect(failedItem).toBeDefined();
    expect((failedItem?.originalSize ?? 0)).toBeGreaterThan(0);

    const successfulFiles = summary.files.filter((f) => f.status === 'success');
    const failedFiles = summary.files.filter((f) => f.status === 'failed');

    const goodSize = successfulFiles.find((f) => f.outputFilename === 'good-001.webp')?.outputSize ?? 0;
    expect(summary.outputBytes).toBe(goodSize);

    const totalOriginal = summary.files.reduce((sum, file) => sum + file.originalSize, 0);
    const succeededOriginal = successfulFiles.reduce((sum, file) => sum + file.originalSize, 0);
    const failedOriginal = failedFiles.reduce((sum, file) => sum + file.originalSize, 0);

    expect(summary.originalBytes).toBe(totalOriginal);
    expect(summary.succeededOriginalBytes).toBe(succeededOriginal);
    expect(summary.failedOriginalBytes).toBe(failedOriginal);
    expect(summary.savedBytes).toBe(summary.succeededOriginalBytes - summary.outputBytes);
    const expectedSavedPercent = summary.succeededOriginalBytes > 0
      ? Number(((summary.savedBytes / summary.succeededOriginalBytes) * 100).toFixed(2))
      : 0;
    expect(summary.savedPercent).toBe(expectedSavedPercent);
  });


  it('auto-orients EXIF-rotated jpeg before webp output', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-orient-'));
    const inputFile = path.join(dir, 'phone.jpg');
    const outputDir = path.join(dir, 'optimized');
    const outputFile = path.join(outputDir, 'phone-001.webp');

    await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: { r: 50, g: 90, b: 140 }
      }
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(inputFile);

    const discovered: DiscoveredFile = {
      absolutePath: inputFile,
      relativePath: 'phone.jpg',
      name: 'phone',
      extension: '.jpg',
      folderName: 'input'
    };

    const plan: RenamePlanItem[] = [{ source: discovered, outputFilename: 'phone-001.webp', outputPath: outputFile }];
    const options: CliOptions = {
      input: dir,
      output: outputDir,
      prefix: 'phone',
      pattern: '{prefix}-{index}',
      quality: 85,
      alphaQuality: 100,
      lossless: false,
      recursive: false,
      dryRun: false,
      keepMetadata: false
    };

    const summary = await processImages(plan, options);
    expect(summary.files[0].status).toBe('success');

    const outputMeta = await sharp(outputFile).metadata();
    expect(outputMeta.width).toBe(20);
    expect(outputMeta.height).toBe(40);
  });

  it('preserves metadata when keepMetadata is enabled', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-meta-'));
    const inputFile = path.join(dir, 'meta.jpg');
    const outputDir = path.join(dir, 'optimized');
    const outputFile = path.join(outputDir, 'meta-001.webp');

    await sharp({
      create: {
        width: 32,
        height: 16,
        channels: 3,
        background: { r: 20, g: 80, b: 160 }
      }
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toFile(inputFile);

    const discovered: DiscoveredFile = {
      absolutePath: inputFile,
      relativePath: 'meta.jpg',
      name: 'meta',
      extension: '.jpg',
      folderName: 'input'
    };

    const plan: RenamePlanItem[] = [{ source: discovered, outputFilename: 'meta-001.webp', outputPath: outputFile }];
    const options: CliOptions = {
      input: dir,
      output: outputDir,
      prefix: 'meta',
      pattern: '{prefix}-{index}',
      quality: 85,
      alphaQuality: 100,
      lossless: false,
      recursive: false,
      dryRun: false,
      keepMetadata: true
    };

    const summary = await processImages(plan, options);
    expect(summary.files[0].status).toBe('success');

    const outputMeta = await sharp(outputFile).metadata();
    expect(outputMeta.exif).toBeDefined();
    expect(outputMeta.width).toBe(16);
    expect(outputMeta.height).toBe(32);
    expect(outputMeta.orientation === undefined || outputMeta.orientation === 1).toBe(true);
  });

});
