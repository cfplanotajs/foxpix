import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
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
  it('importing CLI module does not auto-run main', async () => {
    const previous = process.exitCode;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../src/cli/index.js');

    expect(console.error).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(previous);

    errorSpy.mockRestore();
  });

  it('returns zero for --help', async () => {
    const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await expect(runCli(['--help'])).resolves.toBe(0);
    outSpy.mockRestore();
  });

  it('returns zero for --version', async () => {
    const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await expect(runCli(['--version'])).resolves.toBe(0);
    outSpy.mockRestore();
  });

  it('returns non-zero for invalid input path', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runCli(['--input', '/definitely/not/a/real/path'])).resolves.toBe(1);
    errSpy.mockRestore();
  });

  it('returns non-zero when at least one file fails', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-fail-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });

    await createValidPng(path.join(input, 'good.png'));
    await writeFile(path.join(input, 'bad.png'), 'not-a-real-image', 'utf8');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test']);

    expect(code).toBe(1);

    logSpy.mockRestore();
  });

  it('returns zero when all files succeed', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-ok-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });
    await createValidPng(path.join(input, 'good.png'));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test']);

    expect(code).toBe(0);
    const outputDir = path.join(input, 'optimized');
    expect(existsSync(path.join(outputDir, 'manifest.json'))).toBe(true);
    const csvPath = path.join(outputDir, 'manifest.csv');
    expect(existsSync(csvPath)).toBe(true);
    expect(readFileSync(csvPath, 'utf8').split('\n')[0]).toContain('originalFilename');

    logSpy.mockRestore();
  });

  it('returns zero for successful dry run', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-dry-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });
    await createValidPng(path.join(input, 'good.png'));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const code = await runCli(['--input', input, '--prefix', 'test', '--dryRun']);

    expect(code).toBe(0);
    const outputDir = path.join(input, 'optimized');
    expect(existsSync(path.join(outputDir, 'manifest.json'))).toBe(false);
    expect(existsSync(path.join(outputDir, 'manifest.csv'))).toBe(false);

    logSpy.mockRestore();
  });

  it('rejects unexpected positional arguments and writes nothing', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-cli-positional-'));
    const input = path.join(root, 'input');
    const defaultOutput = path.join(input, 'optimized');
    await mkdir(input, { recursive: true });
    await createValidPng(path.join(input, 'good.png'));

    const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const code = await runCli(['foo', 'bar', '--input', input, '--dryRun']);

    expect(code).not.toBe(0);
    expect(existsSync(defaultOutput)).toBe(false);
    expect(existsSync(path.join(defaultOutput, 'manifest.json'))).toBe(false);

    outSpy.mockRestore();
    errSpy.mockRestore();
  });


  it('returns non-zero for invalid quality', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = await runCli(['--quality', 'abc', '--input', '/tmp']);
    expect(code).not.toBe(0);
    errSpy.mockRestore();
  });

  it('returns non-zero for invalid alphaQuality', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = await runCli(['--alphaQuality', '101', '--input', '/tmp']);
    expect(code).not.toBe(0);
    errSpy.mockRestore();
  });

  it('returns non-zero for invalid maxWidth and maxHeight', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const widthCode = await runCli(['--maxWidth', '0', '--input', '/tmp']);
    const heightCode = await runCli(['--maxHeight', '-5', '--input', '/tmp']);
    expect(widthCode).not.toBe(0);
    expect(heightCode).not.toBe(0);
    errSpy.mockRestore();
  });

});
