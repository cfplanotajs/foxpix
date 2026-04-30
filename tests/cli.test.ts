import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { runCli } from '../src/cli/index.js';

async function createValidPng(filePath: string): Promise<void> {
  await sharp({
    create: {
      width: 24,
      height: 24,
      channels: 4,
      background: { r: 10, g: 150, b: 30, alpha: 1 }
    }
  }).png().toFile(filePath);
}

describe('CLI exit codes', () => {
  it('returns non-zero when at least one file fails', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-fail-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });

    await createValidPng(path.join(input, 'good.png'));
    await writeFile(path.join(input, 'bad.png'), 'not-a-real-image', 'utf8');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test']);

    expect(code).toBe(1);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns zero when all files succeed', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-ok-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });
    await createValidPng(path.join(input, 'good.png'));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test']);

    expect(code).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns zero for successful dry run', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-dry-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });
    await createValidPng(path.join(input, 'good.png'));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test', '--dryRun']);

    expect(code).toBe(0);

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
