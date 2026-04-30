export interface CliOptions {
  input: string;
  output?: string;
  prefix?: string;
  pattern: string;
  custom?: string;
  quality: number;
  alphaQuality: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  recursive: boolean;
  dryRun: boolean;
  keepMetadata: boolean;
}

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  name: string;
  extension: string;
  folderName: string;
}

export interface RenamePlanItem {
  source: DiscoveredFile;
  outputFilename: string;
  outputPath: string;
}

export interface ProcessedFileResult {
  originalFilename: string;
  outputFilename: string;
  originalPath: string;
  outputPath: string;
  originalSize: number;
  outputSize: number;
  width: number;
  height: number;
  compressionPercent: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface ProcessingSummary {
  discovered: number;
  processed: number;
  succeeded: number;
  failed: number;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
  files: ProcessedFileResult[];
}

export interface Manifest {
  generatedAt: string;
  inputFolder: string;
  outputFolder: string;
  settings: Omit<CliOptions, 'input' | 'output' | 'dryRun'>;
  totals: Omit<ProcessingSummary, 'files'>;
  files: ProcessedFileResult[];
}
