import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { createThumbnail } from '../src/core/thumbnail.js';

describe('thumbnail helper', () => {
  it('returns thumbnail data url with bounded dimensions', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-thumb-'));
    const file = path.join(dir, 'in.png');
    await sharp({ create: { width: 200, height: 100, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } } }).png().toFile(file);
    const result = await createThumbnail(file, 72);
    expect(result.dataUrl?.startsWith('data:image/png;base64,')).toBe(true);
    expect((result.width ?? 0) <= 72).toBe(true);
    expect((result.height ?? 0) <= 72).toBe(true);
  });

  it('returns readable error for missing file', async () => {
    const result = await createThumbnail('/no/such/file.png');
    expect(result.error).toBeTruthy();
  });
});
