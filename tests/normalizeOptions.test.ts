import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { normalizeOptions } from '../src/electron/normalizeOptions.js';

const base = {
  pattern: '{name}',
  quality: 85,
  alphaQuality: 100,
  effort: 4,
  lossless: false,
  recursive: false,
  keepMetadata: false
};

describe('normalizeOptions output-folder safety', () => {
  it('normalizes folder mode output when output equals input', () => {
    const input = '/tmp/project/images';
    const options = normalizeOptions({ ...base, input, output: input });
    expect(options.output).toBe(path.join(path.resolve(input), 'optimized'));
  });

  it('uses first selected file directory for default output in selected-files mode', () => {
    const first = '/tmp/project/a/one.png';
    const second = '/tmp/project/b/two.png';
    const options = normalizeOptions({ ...base, filePaths: [first, second] });
    expect(options.input).toBe(path.dirname(path.resolve(first)));
    expect(options.output).toBe(path.join(path.dirname(path.resolve(first)), 'optimized'));
  });

  it('normalizes selected-files mode output when manual output equals first file directory', () => {
    const first = '/tmp/project/a/one.png';
    const second = '/tmp/project/b/two.png';
    const firstDir = path.dirname(path.resolve(first));
    const options = normalizeOptions({ ...base, filePaths: [first, second], output: firstDir });
    expect(options.output).toBe(path.join(firstDir, 'optimized'));
  });
});
