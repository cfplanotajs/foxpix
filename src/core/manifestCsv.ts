import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProcessedFileResult } from '../types/index.js';

function esc(v: string | number | boolean | undefined): string {
  const raw = String(v ?? '');
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

export function toManifestCsv(rows: ProcessedFileResult[]): string {
  const headers = ['originalFilename','desiredOutputFilename','outputFilename','originalPath','outputPath','originalSize','outputSize','width','height','compressionPercent','wasRenamedForCollision','collisionReason','collisionSuffix','outputAlreadyExists','status','error'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.originalFilename,r.desiredOutputFilename ?? '',r.outputFilename,r.originalPath,r.outputPath,r.originalSize,r.outputSize,r.width,r.height,r.compressionPercent,r.wasRenamedForCollision ?? false,r.collisionReason ?? '',r.collisionSuffix ?? '',r.outputAlreadyExists ?? false,r.status,r.error ?? ''
    ].map(esc).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export async function writeManifestCsv(outputFolder: string, rows: ProcessedFileResult[]): Promise<string> {
  const csvPath = path.join(outputFolder, 'manifest.csv');
  await writeFile(csvPath, toManifestCsv(rows), 'utf8');
  return csvPath;
}
