import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRenamePlan } from '../src/core/rename.js';
import type { DiscoveredFile } from '../src/types/index.js';

const baseFile: DiscoveredFile = {
  absolutePath: '/tmp/sample.png',
  relativePath: 'sample.png',
  name: 'Sample Image',
  extension: '.png',
  folderName: 'input'
};

describe('rename plan', () => {
  it('uses default pattern and zero-padded index', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const plan = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{prefix}-{index}' });
    expect(plan[0].outputFilename).toBe('sample-image-001.webp');
  });

  it('slugifies {name} to web-safe filename', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const plan = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}' });
    expect(plan[0].outputFilename).toBe('sample-image.webp');
  });

  it('supports custom pattern with name token', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const plan = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}-{index}' });
    expect(plan[0].outputFilename).toBe('sample-image-001.webp');
  });

  it('supports prefix pattern', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const plan = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{prefix}-{index}', prefix: 'Sticker' });
    expect(plan[0].outputFilename).toBe('sticker-001.webp');
  });



  it('uses format extension for avif/jpeg/png', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const webp = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}', outputFormat: 'webp' });
    const avif = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}', outputFormat: 'avif' });
    const jpeg = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}', outputFormat: 'jpeg' });
    const png = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{name}', outputFormat: 'png' });
    expect(webp[0].outputFilename).toBe('sample-image.webp');
    expect(avif[0].outputFilename).toBe('sample-image.avif');
    expect(jpeg[0].outputFilename).toBe('sample-image.jpg');
    expect(png[0].outputFilename).toBe('sample-image.png');
  });

  it('handles duplicate filenames by suffix', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    await writeFile(path.join(dir, 'sample-image-001.avif'), 'existing', 'utf-8');

    const secondFile: DiscoveredFile = { ...baseFile, absolutePath: '/tmp/second.png', relativePath: 'second.png', name: 'Sample Image' };
    const plan = await buildRenamePlan({ files: [baseFile, secondFile], outputFolder: dir, pattern: '{name}-{index}', outputFormat: 'avif' });

    expect(plan[0].outputFilename).toBe('sample-image-001-2.avif');
    expect(plan[1].outputFilename).toBe('sample-image-002.avif');
  });

  it('supports per-file format overrides in one plan', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const secondFile: DiscoveredFile = { ...baseFile, absolutePath: '/tmp/second.png', relativePath: 'second.png', name: 'Second' };
    const plan = await buildRenamePlan({
      files: [baseFile, secondFile],
      outputFolder: dir,
      pattern: '{name}',
      outputFormat: 'webp',
      formatOverrides: { [baseFile.absolutePath]: 'jpeg', [secondFile.absolutePath]: 'png' }
    });
    expect(plan[0].outputFilename.endsWith('.jpg')).toBe(true);
    expect(plan[1].outputFilename.endsWith('.png')).toBe(true);
  });

  it('falls back to image-index when pattern resolves to empty slug', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    const plan = await buildRenamePlan({ files: [baseFile], outputFolder: dir, pattern: '{custom}', custom: '***' });
    expect(plan[0].outputFilename).toBe('image-001.webp');
  });

  it('adds collision diagnostics for batch duplicates and existing files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-'));
    await writeFile(path.join(dir, 'sample-image.webp'), 'x', 'utf-8');
    const a = { ...baseFile, absolutePath: '/tmp/a.png', relativePath: 'a.png', name: 'Sample Image' };
    const b = { ...baseFile, absolutePath: '/tmp/b.png', relativePath: 'b.png', name: 'Sample Image' };
    const plan = await buildRenamePlan({ files: [a, b], outputFolder: dir, pattern: '{name}' });
    expect(plan[0].wasRenamedForCollision).toBe(true);
    expect(plan[0].collisionReason).toBe('existing-output-file');
    expect(plan[1].wasRenamedForCollision).toBe(true);
    expect(plan[1].collisionReason).toBe('both');
    expect(plan[1].desiredOutputFilename).toBe('sample-image.webp');
  });
});
