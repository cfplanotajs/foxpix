import type { GuiOptions, PreviewRow } from './types.js';

export function applyFolderSourceOptions(prev: GuiOptions, input: string, outputTouched: boolean): GuiOptions {
  return outputTouched ? { ...prev, input, filePaths: [] } : { ...prev, input, filePaths: [], output: '' };
}

export function applyFilesSourceOptions(prev: GuiOptions, filePaths: string[], outputTouched: boolean): GuiOptions {
  return outputTouched ? { ...prev, filePaths, input: undefined } : { ...prev, filePaths, input: undefined, output: '' };
}

export function initializeRowsAfterPreview(rows: PreviewRow[]): Record<string, boolean> {
  return Object.fromEntries(rows.map((r) => [r.id, true]));
}
