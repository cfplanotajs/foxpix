import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { samePhysicalPath, normalizePathForComparison } from '../src/core/pathSafety.js';

describe('pathSafety', () => {
  it('returns true for same resolved physical folder', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-path-'));
    const input = path.join(root, 'input');
    await mkdir(input, { recursive: true });

    expect(samePhysicalPath(input, path.resolve(input))).toBe(true);
  });

  it('normalizes path case on Windows', () => {
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    expect(normalizePathForComparison('C:\\Temp\\Images')).toBe('c:\\temp\\images');
    platformSpy.mockRestore();
  });

  it('treats symlink alias as same physical path when symlink creation is permitted', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'foxpix-path-link-'));
    const input = path.join(root, 'input');
    const alias = path.join(root, 'alias');
    await mkdir(input, { recursive: true });

    try {
      await symlink(input, alias, 'dir');
    } catch {
      return;
    }

    expect(samePhysicalPath(input, alias)).toBe(true);
  });
});
