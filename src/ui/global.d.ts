import type { GuiOptions, PreviewRow } from './types.js';
import type { ProcessingSummary } from '../types/index.js';

declare global {
  interface Window {
    foxpix: {
      selectInputFolder: () => Promise<string | null>;
      selectOutputFolder: () => Promise<string | null>;
      selectImageFiles: () => Promise<string[]>;
      preview: (options: GuiOptions) => Promise<{ inputFolder: string; outputFolder: string; total: number; rows: PreviewRow[] }>;
      process: (options: GuiOptions & { includedPaths?: string[] }) => Promise<{ summary: ProcessingSummary; manifestPath: string; manifestCsvPath: string; outputFolder: string }>;
      generateImagePreview: (payload: { sourcePath: string; outputFilename?: string; options: GuiOptions }) => Promise<{ sourcePath: string; outputFilename?: string; original: { dataUrl: string; format?: string; width?: number; height?: number; bytes: number; hasAlpha?: boolean }; optimized?: { dataUrl: string; format: string; width?: number; height?: number; estimatedBytes: number; savedBytes: number; savedPercent: number }; warning?: string; error?: string }>;
      estimateSizes: (options: GuiOptions & { includedPaths?: string[] }) => Promise<{ rows: PreviewRow[]; totals: { totalOriginalBytes: number; totalEstimatedOutputBytes: number; totalEstimatedSavedBytes: number; totalEstimatedSavedPercent: number; estimatedCount: number; failedCount: number } }>;
      loadSettings: () => Promise<Partial<GuiOptions & { outputTouched: boolean; selectedPreset: string }> | null>;
      saveSettings: (settings: Partial<GuiOptions & { outputTouched: boolean; selectedPreset: string }>) => Promise<{ ok: true } | { ok: false; error: string }>;
      resolveDroppedItems: (files: File[] | FileList) => Promise<{ kind: 'folder'; path: string } | { kind: 'files'; paths: string[] } | { kind: 'invalid'; error: string }>;
      openFolder: (folderPath: string) => Promise<{ ok: true } | { ok: false; error: string }>; 
    };
  }
}

export {};
