export type OutputFormat = 'webp' | 'avif' | 'jpeg' | 'png';

export const DEFAULT_OUTPUT_FORMAT: OutputFormat = 'webp';

export function isOutputFormat(value: unknown): value is OutputFormat {
  return value === 'webp' || value === 'avif' || value === 'jpeg' || value === 'png';
}

export function normalizeOutputFormat(value: unknown): OutputFormat {
  return isOutputFormat(value) ? value : DEFAULT_OUTPUT_FORMAT;
}

export interface CliOptions {
  input: string;
  output: string;
  prefix?: string;
  pattern: string;
  custom?: string;
  quality: number;
  alphaQuality: number;
  effort?: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  recursive: boolean;
  dryRun: boolean;
  keepMetadata: boolean;
  outputFormat?: OutputFormat;
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
  desiredOutputFilename?: string;
  outputFilename: string;
  outputPath: string;
  wasRenamedForCollision?: boolean;
  collisionReason?: 'batch-duplicate' | 'existing-output-file' | 'both';
  collisionSuffix?: number;
  outputAlreadyExists?: boolean;
  outputFormat?: OutputFormat;
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
  succeededOriginalBytes: number;
  failedOriginalBytes: number;
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
