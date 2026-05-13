import type { OutputFormat } from '../types/index.js';
import type { PreviewRow } from './types.js';

export function buildRecommendations(args: { rows: PreviewRow[]; includedMap: Record<string, boolean>; outputFormat: OutputFormat; estimatesReady: boolean; estimatesStale: boolean; outputFolderStatus?: { status: string; path: string; error?: string } | null; patternWarnings?: string[] }): string[] {
  const notes: string[] = [];
  const included = args.rows.filter((r) => args.includedMap[r.id] !== false);
  const failed = included.filter((r) => r.error);
  const larger = included.filter((r) => typeof r.estimatedSavedBytes === 'number' && r.estimatedSavedBytes < 0);
  const renamed = included.filter((r) => r.wasRenamedForCollision);
  const existingConflicts = included.filter((r) => r.collisionReason === 'existing-output-file' || r.collisionReason === 'both');
  if (args.outputFormat === 'jpeg' && failed.some((r) => r.error?.includes('JPEG does not support transparency'))) notes.push('Some transparent images are targeting JPEG. Use WebP, AVIF, or PNG to preserve transparency.');
  if (!args.estimatesReady) notes.push('Run Estimate Sizes to preview expected output size before processing.');
  if (args.estimatesStale) notes.push('Settings changed after estimation. Estimate again for accurate size predictions.');
  if (larger.length > 0) notes.push('Some files may become larger after conversion. Review rows with negative savings.');
  if (args.outputFormat === 'avif') notes.push('AVIF can be smaller but slower to encode.');
  if (args.outputFormat === 'png') notes.push('PNG preserves transparency but may create larger files.');
  if (included.length === 0) notes.push('Select at least one image to process.');
  if (renamed.length > 0) notes.push('Some filenames were adjusted to avoid duplicates. Review the Renamed filter before processing.');
  if (existingConflicts.length > 0) notes.push('The output folder already contains matching filenames. FoxPix will save new files with safe suffixes.');
  if (renamed.length > 10) notes.push('Many output names are being adjusted. Consider changing the filename pattern or output folder.');
  if (args.outputFolderStatus?.status === 'will-create') notes.push('Output folder will be created during processing.');
  if (args.outputFolderStatus?.status === 'not-directory') notes.push('Output path is not a folder. Choose another output location.');
  if (args.outputFolderStatus?.status === 'not-accessible') notes.push('Output folder cannot be accessed. Choose another output location.');
  if (args.patternWarnings?.some((w) => w.includes('duplicates'))) notes.push('This filename pattern may create many duplicates. Consider adding {name} or {index}.');
  if (args.patternWarnings?.some((w) => w.includes('{custom}'))) notes.push('Add custom text or remove {custom} from the pattern.');
  if (args.patternWarnings?.some((w) => w.includes('{prefix}'))) notes.push('Add a prefix or remove {prefix} from the pattern.');
  return notes;
}

export function computeFormatMix(rows: PreviewRow[]): Record<OutputFormat, number> {
  return rows.reduce((acc, r) => ({ ...acc, [r.targetFormat]: (acc[r.targetFormat] ?? 0) + 1 }), { webp: 0, avif: 0, jpeg: 0, png: 0 } as Record<OutputFormat, number>);
}
