import { mkdir, stat } from 'node:fs/promises';
import sharp from 'sharp';
import type { CliOptions, ProcessingSummary, RenamePlanItem, ProcessedFileResult } from '../types/index.js';

export async function processImages(plan: RenamePlanItem[], options: CliOptions): Promise<ProcessingSummary> {
  await mkdir(options.output, { recursive: true });

  const files: ProcessedFileResult[] = [];
  for (const item of plan) {
    try {
      let pipeline = sharp(item.source.absolutePath, { failOn: 'none' }).rotate();
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      if (options.keepMetadata) {
        pipeline = pipeline.keepMetadata();
      }

      await pipeline
        .webp({
          quality: options.quality,
          alphaQuality: options.alphaQuality,
          lossless: options.lossless,
          effort: 4
        })
        .toFile(item.outputPath);

      const originalStat = await stat(item.source.absolutePath);
      const outputStat = await stat(item.outputPath);
      const outputMetadata = await sharp(item.outputPath).metadata();
      const compressionPercent = originalStat.size > 0
        ? Number((((originalStat.size - outputStat.size) / originalStat.size) * 100).toFixed(2))
        : 0;

      files.push({
        originalFilename: item.source.relativePath,
        outputFilename: item.outputFilename,
        originalPath: item.source.absolutePath,
        outputPath: item.outputPath,
        originalSize: originalStat.size,
        outputSize: outputStat.size,
        width: outputMetadata.width ?? 0,
        height: outputMetadata.height ?? 0,
        compressionPercent,
        status: 'success'
      });
    } catch (error) {
      const originalStat = await stat(item.source.absolutePath).catch(() => null);
      files.push({
        originalFilename: item.source.relativePath,
        outputFilename: item.outputFilename,
        originalPath: item.source.absolutePath,
        outputPath: item.outputPath,
        originalSize: originalStat?.size ?? 0,
        outputSize: 0,
        width: 0,
        height: 0,
        compressionPercent: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const discovered = plan.length;
  const processed = files.length;
  const succeeded = files.filter((f) => f.status === 'success').length;
  const failed = files.filter((f) => f.status === 'failed').length;
  const originalBytes = files.reduce((sum, f) => sum + f.originalSize, 0);
  const succeededOriginalBytes = files.filter((f) => f.status === 'success').reduce((sum, f) => sum + f.originalSize, 0);
  const failedOriginalBytes = files.filter((f) => f.status === 'failed').reduce((sum, f) => sum + f.originalSize, 0);
  const outputBytes = files.filter((f) => f.status === 'success').reduce((sum, f) => sum + f.outputSize, 0);
  const savedBytes = succeededOriginalBytes - outputBytes;
  const savedPercent = succeededOriginalBytes > 0 ? Number(((savedBytes / succeededOriginalBytes) * 100).toFixed(2)) : 0;

  return { discovered, processed, succeeded, failed, originalBytes, succeededOriginalBytes, failedOriginalBytes, outputBytes, savedBytes, savedPercent, files };
}
