import type { GuiOptions, PreviewRow, StoredGuiSettings } from './types.js';
import type { ProcessingSummary } from '../types/index.js';

declare global {
  interface Window {
    foxpix: {
      selectInputFolder: () => Promise<string | null>;
      selectOutputFolder: () => Promise<string | null>;
      selectImageFiles: () => Promise<string[]>;
      preview: (options: GuiOptions & { formatOverrides?: Record<string, string> }) => Promise<{ inputFolder: string; outputFolder: string; outputFolderStatus?: { status: string; path: string; error?: string }; total: number; rows: PreviewRow[] }>;
      process: (options: GuiOptions & { includedPaths?: string[]; formatOverrides?: Record<string, string> }) => Promise<{ summary: ProcessingSummary; manifestPath: string; manifestCsvPath: string; outputFolder: string }>;
      generateImagePreview: (payload: { sourcePath: string; outputFilename?: string; outputFormatOverride?: GuiOptions['outputFormat']; options: GuiOptions }) => Promise<{ sourcePath: string; outputFilename?: string; original: { dataUrl: string; format?: string; width?: number; height?: number; bytes: number; hasAlpha?: boolean }; optimized?: { dataUrl: string; format: string; width?: number; height?: number; estimatedBytes: number; savedBytes: number; savedPercent: number }; warning?: string; error?: string }>;
      estimateSizes: (options: GuiOptions & { includedPaths?: string[]; formatOverrides?: Record<string, string> }) => Promise<{ rows: PreviewRow[]; totals: { totalOriginalBytes: number; totalEstimatedOutputBytes: number; totalEstimatedSavedBytes: number; totalEstimatedSavedPercent: number; estimatedCount: number; failedCount: number } }>;
      getThumbnails: (payload: { sourcePaths: string[] }) => Promise<Array<{ sourcePath: string; dataUrl?: string; width?: number; height?: number; hasAlpha?: boolean; error?: string }>>;
      loadSettings: () => Promise<StoredGuiSettings | null>;
      saveSettings: (settings: StoredGuiSettings) => Promise<{ ok: true } | { ok: false; error: string }>;
      exportPresets: (payload: unknown) => Promise<{ ok: true } | { ok: false; error: string }>;
      importPresets: () => Promise<{ ok: true; rawJson: string } | { ok: false; error: string }>;
      resolveDroppedItems: (files: File[] | FileList) => Promise<{ kind: 'folder'; path: string } | { kind: 'files'; paths: string[] } | { kind: 'invalid'; error: string }>;
      openFolder: (folderPath: string) => Promise<{ ok: true } | { ok: false; error: string }>; 
    };
  }
}

export {};
