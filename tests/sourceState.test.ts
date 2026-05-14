import { describe, expect, it } from 'vitest';
import { applyFilesSourceOptions, applyFolderSourceOptions, initializeRowsAfterPreview } from '../src/ui/sourceState.js';

const base: any = { input: '/old', filePaths: ['/a.png'], output: '/old/optimized' };

describe('source state helpers', () => {
  it('folder source clears output when outputTouched is false', () => {
    const next = applyFolderSourceOptions(base, '/new', false as any);
    expect(next.input).toBe('/new');
    expect(next.filePaths).toEqual([]);
    expect(next.output).toBe('');
  });

  it('folder source preserves output when outputTouched is true', () => {
    const next = applyFolderSourceOptions(base, '/new', true as any);
    expect(next.output).toBe('/old/optimized');
  });

  it('selected files source clears input and respects outputTouched', () => {
    const next = applyFilesSourceOptions(base, ['/x.png'], false as any);
    expect(next.input).toBeUndefined();
    expect(next.filePaths).toEqual(['/x.png']);
    expect(next.output).toBe('');
  });

  it('initializes included map as all true', () => {
    expect(initializeRowsAfterPreview([{ id: '1' } as any, { id: '2' } as any])).toEqual({ '1': true, '2': true });
  });
});
