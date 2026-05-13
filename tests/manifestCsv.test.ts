import { describe, expect, it } from 'vitest';
import { toManifestCsv } from '../src/core/manifestCsv.js';

describe('manifest csv', () => {
  it('writes header and escapes values', () => {
    const csv = toManifestCsv([{ originalFilename: 'a,"b".png', desiredOutputFilename: 'a.webp', outputFilename: 'a-2.webp', originalPath: '/in/a.png', outputPath: '/out/a.webp', originalSize: 10, outputSize: 5, width: 1, height: 1, compressionPercent: 50, wasRenamedForCollision: true, collisionReason: 'existing-output-file', collisionSuffix: 2, outputAlreadyExists: true, status: 'failed', error: 'bad\nimage' }]);
    expect(csv.split('\n')[0]).toContain('originalFilename');
    expect(csv.split('\n')[0]).toContain('desiredOutputFilename');
    expect(csv).toContain('"a,""b"".png"');
    expect(csv).toContain('"bad\nimage"');
  });
});
