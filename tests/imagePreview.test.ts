import { describe, expect, it } from 'vitest';
import { mkdtemp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { generateImagePreview } from '../src/core/imagePreview.js';
import type { CliOptions } from '../src/types/index.js';

describe('image preview helper', () => {
  it('returns original and optimized previews for png->webp', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-prev-'));
    const file = path.join(dir, 'in.png');
    await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 20, g: 80, b: 90, alpha: 1 } } }).png().toFile(file);
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await generateImagePreview(file, options, 'in.webp');
    expect(result.original.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.optimized?.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('uses explicit row override format when provided', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-prev-override-'));
    const file = path.join(dir, 'in.png');
    await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 20, g: 80, b: 90, alpha: 1 } } }).png().toFile(file);
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await generateImagePreview(file, options, 'in.png', 'png');
    expect(result.optimized?.format).toBe('png');
  });

  it('returns friendly error for transparent jpeg override', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-prev-jpeg-'));
    const file = path.join(dir, 'in.png');
    await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 20, g: 80, b: 90, alpha: 0 } } }).png().toFile(file);
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await generateImagePreview(file, options, 'in.jpg', 'jpeg');
    expect(result.error).toContain('JPEG does not support transparency');
  });
});


  it('uses filesystem byte size for original bytes and writes no files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-prev-bytes-'));
    const file = path.join(dir, 'in.png');
    await sharp({ create: { width: 20, height: 20, channels: 3, background: { r: 30, g: 50, b: 90 } } }).png().toFile(file);
    const originalStat = await stat(file);
    const options: CliOptions = { input: dir, output: dir, pattern: '{name}', quality: 85, alphaQuality: 100, lossless: false, recursive: false, dryRun: false, keepMetadata: false, outputFormat: 'webp' };
    const result = await generateImagePreview(file, options, 'in.webp');
    expect(result.original.bytes).toBe(originalStat.size);
    expect(Number.isFinite(result.optimized?.savedPercent ?? 0)).toBe(true);
    const after = await readdir(dir);
    expect(after.sort()).toEqual(['in.png']);
  });
