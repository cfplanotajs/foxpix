import { describe, expect, it } from 'vitest';
import { createManifest } from '../src/core/manifest.js';
import type { CliOptions, ProcessingSummary } from '../src/types/index.js';

describe('manifest', () => {
  const options: CliOptions = {
    input: '/input',
    output: '/output',
    prefix: 'product',
    pattern: '{prefix}-{index}',
    custom: undefined,
    quality: 85,
    alphaQuality: 100,
    lossless: false,
    maxWidth: undefined,
    maxHeight: undefined,
    recursive: false,
    dryRun: false,
    keepMetadata: false
  };

  it('has totals shape', () => {
    const summary: ProcessingSummary = {
      discovered: 2,
      processed: 2,
      succeeded: 1,
      failed: 1,
      originalBytes: 1000,
      succeededOriginalBytes: 800,
      failedOriginalBytes: 200,
      outputBytes: 600,
      savedBytes: 400,
      savedPercent: 40,
      files: []
    };

    const manifest = createManifest(options, summary);
    expect(manifest.totals.discovered).toBe(2);
    expect(manifest.totals.savedPercent).toBe(40);
    expect(manifest.totals.failedOriginalBytes).toBe(200);
  });

  it('keeps failed item shape and compression percent', () => {
    const summary: ProcessingSummary = {
      discovered: 1,
      processed: 1,
      succeeded: 0,
      failed: 1,
      originalBytes: 0,
      succeededOriginalBytes: 0,
      failedOriginalBytes: 0,
      outputBytes: 0,
      savedBytes: 0,
      savedPercent: 0,
      files: [{
        originalFilename: 'input/a.png',
        outputFilename: 'a-001.webp',
        originalPath: '/input/a.png',
        outputPath: '/output/a-001.webp',
        originalSize: 0,
        outputSize: 0,
        width: 0,
        height: 0,
        compressionPercent: 0,
        status: 'failed',
        error: 'decode error'
      }]
    };

    const manifest = createManifest(options, summary);
    expect(manifest.files[0].status).toBe('failed');
    expect(manifest.files[0].compressionPercent).toBe(0);
    expect(manifest.files[0].error).toBe('decode error');
  });
});
