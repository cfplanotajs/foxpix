import type { GuiOptions, PreviewRow } from './types.js';
import type { ProcessingSummary } from '../types/index.js';

declare global {
  interface Window {
    foxpix: {
      selectInputFolder: () => Promise<string | null>;
      selectOutputFolder: () => Promise<string | null>;
      selectImageFiles: () => Promise<string[]>;
      preview: (options: GuiOptions) => Promise<{ inputFolder: string; outputFolder: string; total: number; rows: PreviewRow[] }>;
      process: (options: GuiOptions) => Promise<{ summary: ProcessingSummary; manifestPath: string; manifestCsvPath: string; outputFolder: string }>;
      loadSettings: () => Promise<Partial<GuiOptions & { outputTouched: boolean; selectedPreset: string }> | null>;
      saveSettings: (settings: Partial<GuiOptions & { outputTouched: boolean; selectedPreset: string }>) => Promise<{ ok: true } | { ok: false; error: string }>;
      resolveDroppedPath: (file: File) => Promise<string | null>;
      resolveDroppedFilePath: (file: File) => Promise<string | null>;
      openFolder: (folderPath: string) => Promise<{ ok: true } | { ok: false; error: string }>; 
    };
  }
}

export {};
