import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import type { CliOptions, RenamePlanItem, OutputFormat } from '../types/index.js';
import { normalizeOutputFormat } from '../types/index.js';

export interface EstimateRow {
  id: string;
  sourcePath: string;
  originalFilename: string;
  outputFilename: string;
  sourceFormat: string;
  targetFormat: OutputFormat;
  originalSize: number;
  estimatedOutputSize?: number;
  estimatedSavedBytes?: number;
  estimatedSavedPercent?: number;
  width: number;
  height: number;
  status: 'estimated' | 'warning' | 'failed';
  error?: string;
}

function hasAlpha(meta: sharp.Metadata): boolean {
  return Boolean(meta.hasAlpha || (typeof meta.channels === 'number' && meta.channels >= 4));
}

export async function estimateImages(plan: RenamePlanItem[], options: CliOptions): Promise<{ rows: EstimateRow[]; totals: { totalOriginalBytes: number; totalEstimatedOutputBytes: number; totalEstimatedSavedBytes: number; totalEstimatedSavedPercent: number; estimatedCount: number; failedCount: number } }> {
  const rows: EstimateRow[] = [];
  for (const item of plan) {
    const sourcePath = item.source.absolutePath;
    const fallbackOriginalSize = await stat(sourcePath).then((info) => info.size).catch(() => 0);
    try {
      let pipeline = sharp(sourcePath, { failOn: 'none' }).rotate();
      if (options.maxWidth || options.maxHeight) pipeline = pipeline.resize({ width: options.maxWidth, height: options.maxHeight, fit: 'inside', withoutEnlargement: true });
      if (options.keepMetadata) pipeline = pipeline.keepMetadata();
      const srcMeta = await sharp(sourcePath, { failOn: 'none' }).metadata();
      const outputFormat = normalizeOutputFormat(item.outputFormat ?? options.outputFormat);
      if (outputFormat === 'jpeg' && hasAlpha(srcMeta)) throw new Error('JPEG does not support transparency. Choose WebP, AVIF, or PNG for transparent assets.');
      const effort = Number.isInteger(options.effort) && (options.effort ?? 0) >= 0 && (options.effort ?? 0) <= 6 ? options.effort : 4;
      const encoded = outputFormat === 'avif' ? await pipeline.avif({ quality: options.quality, effort }).toBuffer({ resolveWithObject: true })
        : outputFormat === 'jpeg' ? await pipeline.jpeg({ quality: options.quality }).toBuffer({ resolveWithObject: true })
        : outputFormat === 'png' ? await pipeline.png().toBuffer({ resolveWithObject: true })
        : await pipeline.webp({ quality: options.quality, alphaQuality: options.alphaQuality, lossless: options.lossless, effort }).toBuffer({ resolveWithObject: true });
      const originalSize = fallbackOriginalSize;
      const estimatedOutputSize = encoded.info.size;
      const estimatedSavedBytes = originalSize - estimatedOutputSize;
      const estimatedSavedPercent = originalSize > 0 ? Number(((estimatedSavedBytes / originalSize) * 100).toFixed(2)) : 0;
      rows.push({ id: sourcePath, sourcePath, originalFilename: item.source.relativePath, outputFilename: item.outputFilename, sourceFormat: item.source.extension.replace('.', ''), targetFormat: outputFormat, originalSize, estimatedOutputSize, estimatedSavedBytes, estimatedSavedPercent, width: encoded.info.width ?? 0, height: encoded.info.height ?? 0, status: 'estimated' });
    } catch (error) {
      rows.push({ id: sourcePath, sourcePath, originalFilename: item.source.relativePath, outputFilename: item.outputFilename, sourceFormat: item.source.extension.replace('.', ''), targetFormat: normalizeOutputFormat(item.outputFormat ?? options.outputFormat), originalSize: fallbackOriginalSize, width: 0, height: 0, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  const success = rows.filter((r) => r.status === 'estimated');
  const totalOriginalBytes = success.reduce((s, r) => s + r.originalSize, 0);
  const totalEstimatedOutputBytes = success.reduce((s, r) => s + (r.estimatedOutputSize ?? 0), 0);
  const totalEstimatedSavedBytes = totalOriginalBytes - totalEstimatedOutputBytes;
  const totalEstimatedSavedPercent = totalOriginalBytes > 0 ? Number(((totalEstimatedSavedBytes / totalOriginalBytes) * 100).toFixed(2)) : 0;
  return { rows, totals: { totalOriginalBytes, totalEstimatedOutputBytes, totalEstimatedSavedBytes, totalEstimatedSavedPercent, estimatedCount: success.length, failedCount: rows.length - success.length } };
}
