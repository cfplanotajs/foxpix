import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getOutputFolderStatus } from '../src/core/outputFolderStatus.js';

describe('outputFolderStatus', () => {
  it('returns will-create for missing folder', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-status-'));
    const status = await getOutputFolderStatus(path.join(root, 'missing'));
    expect(status.status).toBe('will-create');
  });
  it('returns exists for existing directory', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'foxpix-status-'));
    const status = await getOutputFolderStatus(dir);
    expect(status.status).toBe('exists');
  });
  it('returns not-directory for file path', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-status-'));
    const fp = path.join(root, 'file.txt');
    await writeFile(fp, 'x', 'utf8');
    const status = await getOutputFolderStatus(fp);
    expect(status.status).toBe('not-directory');
  });
});
