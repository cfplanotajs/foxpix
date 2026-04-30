export interface GuiOptions {
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
  keepMetadata: boolean;
}

export interface PreviewRow {
  originalFilename: string;
  outputFilename: string;
  originalSize: number;
  status: 'planned';
}
