import { describe, expect, it } from 'vitest';
import { mkdtemp, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { estimateImages } from '../src/core/estimateImages.js';
import type { CliOptions, DiscoveredFile, RenamePlanItem } from '../src/types/index.js';

async function createTransparentPng(filePath: string): Promise<void> {
  await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(filePath);
}

describe('estimateImages', () => {
  it('estimates webp sizes in memory', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-est-'));
    const input = path.join(dir, 'a.png');
    await createTransparentPng(input);
    const file: DiscoveredFile = { absolutePath: input, relativePath: 'a.png', name: 'a', extension: '.png', folderName: 'input' };
    const plan: RenamePlanItem[] = [{ source: file, outputFilename: 'a.webp', outputPath: path.join(dir, 'out.webp') }];
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await estimateImages(plan, options);
    expect(result.rows[0].status).toBe('estimated');
    expect(result.rows[0].id).toBe(input);
    expect(result.rows[0].sourcePath).toBe(input);
    expect((result.rows[0].estimatedOutputSize ?? 0)).toBeGreaterThan(0);
    expect(result.rows[0].originalSize).toBe((await stat(input)).size);
    expect(result.totals.totalOriginalBytes).toBe((await stat(input)).size);
  });

  it('fails jpeg estimate for transparent source', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-est-jpeg-'));
    const input = path.join(dir, 'a.png');
    await createTransparentPng(input);
    const file: DiscoveredFile = { absolutePath: input, relativePath: 'a.png', name: 'a', extension: '.png', folderName: 'input' };
    const plan: RenamePlanItem[] = [{ source: file, outputFilename: 'a.jpg', outputPath: path.join(dir, 'out.jpg') }];
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'jpeg' };
    const result = await estimateImages(plan, options);
    expect(result.rows[0].status).toBe('failed');
    expect(result.rows[0].error).toContain('JPEG does not support transparency');
    expect(result.rows[0].id).toBe(input);
    expect(result.rows[0].sourcePath).toBe(input);
    expect(result.rows[0].originalSize).toBe((await stat(input)).size);
    expect(Number.isFinite(result.totals.totalEstimatedSavedPercent)).toBe(true);
  });

  it('returns rows that can be merged back to preview rows by id', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-est-merge-'));
    const inputA = path.join(dir, 'a.png');
    const inputB = path.join(dir, 'b.png');
    await createTransparentPng(inputA);
    await createTransparentPng(inputB);
    const plan: RenamePlanItem[] = [
      { source: { absolutePath: inputA, relativePath: 'a.png', name: 'a', extension: '.png', folderName: 'input' }, outputFilename: 'a.webp', outputPath: path.join(dir, 'a.webp') },
      { source: { absolutePath: inputB, relativePath: 'b.png', name: 'b', extension: '.png', folderName: 'input' }, outputFilename: 'b.webp', outputPath: path.join(dir, 'b.webp') }
    ];
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await estimateImages(plan, options);
    const foundA = result.rows.find((row) => row.id === inputA);
    const foundB = result.rows.find((row) => row.id === inputB);
    expect(foundA?.sourcePath).toBe(inputA);
    expect(foundB?.sourcePath).toBe(inputB);
  });
});
