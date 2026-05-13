import sharp from 'sharp';
import type { CliOptions, OutputFormat } from '../types/index.js';
import { normalizeOutputFormat } from '../types/index.js';

export interface ImagePreviewResult {
  sourcePath: string;
  outputFilename?: string;
  original: { dataUrl: string; format?: string; width?: number; height?: number; bytes: number; hasAlpha?: boolean };
  optimized?: { dataUrl: string; format: OutputFormat; width?: number; height?: number; estimatedBytes: number; savedBytes: number; savedPercent: number };
  warning?: string;
  error?: string;
}

function hasAlpha(meta: sharp.Metadata): boolean { return Boolean(meta.hasAlpha || (typeof meta.channels === 'number' && meta.channels >= 4)); }
function toDataUrl(buffer: Buffer, mime: string): string { return `data:${mime};base64,${buffer.toString('base64')}`; }

export async function generateImagePreview(sourcePath: string, options: CliOptions, outputFilename?: string): Promise<ImagePreviewResult> {
  try {
    const displayMax = 1200;
    const originalObj = await sharp(sourcePath, { failOn: 'none' }).rotate().resize({ width: displayMax, height: displayMax, fit: 'inside', withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
    const srcMeta = await sharp(sourcePath, { failOn: 'none' }).metadata();
    const srcBytes = (await sharp(sourcePath, { failOn: 'none' }).toBuffer({ resolveWithObject: true })).info.size;
    const fmt = normalizeOutputFormat(options.outputFormat);
    if (fmt === 'jpeg' && hasAlpha(srcMeta)) {
      return { sourcePath, outputFilename, original: { dataUrl: toDataUrl(originalObj.data, 'image/png'), format: srcMeta.format, width: originalObj.info.width, height: originalObj.info.height, bytes: srcBytes, hasAlpha: hasAlpha(srcMeta) }, error: 'JPEG does not support transparency. Choose WebP, AVIF, or PNG for transparent assets.' };
    }
    let pipe = sharp(sourcePath, { failOn: 'none' }).rotate();
    if (options.maxWidth || options.maxHeight) pipe = pipe.resize({ width: options.maxWidth, height: options.maxHeight, fit: 'inside', withoutEnlargement: true });
    if (options.keepMetadata) pipe = pipe.keepMetadata();
    const effort = Number.isInteger(options.effort) && (options.effort ?? 0) >= 0 && (options.effort ?? 0) <= 6 ? options.effort : 4;
    const optimized = fmt === 'avif' ? await pipe.avif({ quality: options.quality, effort }).toBuffer({ resolveWithObject: true }) : fmt === 'jpeg' ? await pipe.jpeg({ quality: options.quality }).toBuffer({ resolveWithObject: true }) : fmt === 'png' ? await pipe.png().toBuffer({ resolveWithObject: true }) : await pipe.webp({ quality: options.quality, alphaQuality: options.alphaQuality, effort, lossless: options.lossless }).toBuffer({ resolveWithObject: true });
    const displayOptimized = await sharp(optimized.data).resize({ width: displayMax, height: displayMax, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    const saved = srcBytes - optimized.info.size;
    return { sourcePath, outputFilename, original: { dataUrl: toDataUrl(originalObj.data, 'image/png'), format: srcMeta.format, width: originalObj.info.width, height: originalObj.info.height, bytes: srcBytes, hasAlpha: hasAlpha(srcMeta) }, optimized: { dataUrl: toDataUrl(displayOptimized, 'image/png'), format: fmt, width: optimized.info.width, height: optimized.info.height, estimatedBytes: optimized.info.size, savedBytes: saved, savedPercent: srcBytes > 0 ? Number(((saved / srcBytes) * 100).toFixed(2)) : 0 } };
  } catch (error) {
    return { sourcePath, outputFilename, original: { dataUrl: '', bytes: 0 }, error: error instanceof Error ? error.message : String(error) };
  }
}
