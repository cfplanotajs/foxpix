import { describe, expect, it } from 'vitest';
import { workflowPresets } from '../src/core/presets.js';

describe('workflow presets', () => {
  it('defines web-safe original preset', () => {
    expect(workflowPresets['web-safe-original'].pattern).toBe('{name}');
    expect(workflowPresets['web-safe-original'].quality).toBe(85);
  });
});
