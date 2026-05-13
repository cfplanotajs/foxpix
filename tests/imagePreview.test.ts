import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
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
});
