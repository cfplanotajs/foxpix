import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProcessedFileResult } from '../types/index.js';

function esc(v: string | number | undefined): string {
  const raw = String(v ?? '');
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function toManifestCsv(rows: ProcessedFileResult[]): string {
  const headers = ['originalFilename','outputFilename','originalPath','outputPath','originalSize','outputSize','width','height','compressionPercent','status','error'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.originalFilename,r.outputFilename,r.originalPath,r.outputPath,r.originalSize,r.outputSize,r.width,r.height,r.compressionPercent,r.status,r.error ?? ''
    ].map(esc).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export async function writeManifestCsv(outputFolder: string, rows: ProcessedFileResult[]): Promise<string> {
  const csvPath = path.join(outputFolder, 'manifest.csv');
  await writeFile(csvPath, toManifestCsv(rows), 'utf8');
  return csvPath;
}
