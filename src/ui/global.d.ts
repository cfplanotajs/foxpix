import type { GuiOptions, PreviewRow } from './types.js';
import type { ProcessingSummary } from '../types/index.js';

declare global {
  interface Window {
    foxpix: {
      selectInputFolder: () => Promise<string | null>;
      selectOutputFolder: () => Promise<string | null>;
      preview: (options: GuiOptions) => Promise<{ inputFolder: string; outputFolder: string; total: number; rows: PreviewRow[] }>;
      process: (options: GuiOptions) => Promise<{ summary: ProcessingSummary; manifestPath: string }>;
      openFolder: (folderPath: string) => Promise<{ ok: true } | { ok: false; error: string }>; 
    };
  }
}

export {};
