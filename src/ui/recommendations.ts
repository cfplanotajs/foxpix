import type { OutputFormat } from '../types/index.js';
import type { PreviewRow } from './types.js';
import type { ReviewFilter } from './reviewState.js';

export type RecommendationAction = { type: 'run-estimate' | 'select-all' | 'set-pattern' | 'set-review-filter' | 'set-risky-jpeg-rows-to-webp'; label: string; pattern?: string; filter?: ReviewFilter };
export type RecommendationItem = { text: string; action?: RecommendationAction };
export function buildRecommendations(args: { rows: PreviewRow[]; includedMap: Record<string, boolean>; outputFormat: OutputFormat; estimatesReady: boolean; estimatesStale: boolean; outputFolderStatus?: { status: string; path: string; error?: string } | null; patternWarnings?: string[] }): RecommendationItem[] {
  const notes: RecommendationItem[] = [];
  const included = args.rows.filter((r) => args.includedMap[r.id] !== false);
  const failed = included.filter((r) => r.error);
  const larger = included.filter((r) => typeof r.estimatedSavedBytes === 'number' && r.estimatedSavedBytes < 0);
  const renamed = included.filter((r) => r.wasRenamedForCollision);
  const existingConflicts = included.filter((r) => r.collisionReason === 'existing-output-file' || r.collisionReason === 'both');
  if (args.outputFormat === 'jpeg' && failed.some((r) => r.error?.includes('JPEG does not support transparency'))) notes.push({ text: 'Some transparent images are targeting JPEG. Use WebP, AVIF, or PNG to preserve transparency.', action: { type: 'set-risky-jpeg-rows-to-webp', label: 'Switch risky rows to WebP' } });
  if (!args.estimatesReady) notes.push({ text: 'Run Estimate Sizes to preview expected output size before processing.', action: { type: 'run-estimate', label: 'Run Estimate Sizes' } });
  if (args.estimatesStale) notes.push({ text: 'Settings changed after estimation. Estimate again for accurate size predictions.', action: { type: 'run-estimate', label: 'Estimate again' } });
  if (larger.length > 0) notes.push({ text: 'Some files may become larger after conversion. Review rows with negative savings.', action: { type: 'set-review-filter', label: 'Show Larger filter', filter: 'larger' } });
  if (args.outputFormat === 'avif') notes.push({ text: 'AVIF can be smaller but slower to encode.' });
  if (args.outputFormat === 'png') notes.push({ text: 'PNG preserves transparency but may create larger files.', action: { type: 'run-estimate', label: 'Run Estimate Sizes' } });
  if (included.length === 0) notes.push({ text: 'Select at least one image to process.', action: { type: 'select-all', label: 'Select all rows' } });
  if (renamed.length > 0) notes.push({ text: 'Some filenames were adjusted to avoid duplicates. Review the Renamed filter before processing.', action: { type: 'set-review-filter', label: 'Show Renamed filter', filter: 'renamed' } });
  if (existingConflicts.length > 0) notes.push({ text: 'The output folder already contains matching filenames. FoxPix will save new files with safe suffixes.', action: { type: 'set-review-filter', label: 'Show Renamed filter', filter: 'renamed' } });
  if (renamed.length > 10) notes.push({ text: 'Many output names are being adjusted. Consider changing the filename pattern or output folder.' });
  if (args.outputFolderStatus?.status === 'will-create') notes.push({ text: 'Output folder will be created during processing.' });
  if (args.outputFolderStatus?.status === 'not-directory') notes.push({ text: 'Output path is not a folder. Choose another output location.' });
  if (args.outputFolderStatus?.status === 'not-accessible') notes.push({ text: 'Output folder cannot be accessed. Choose another output location.' });
  if (args.patternWarnings?.some((w) => w.includes('duplicates'))) notes.push({ text: 'This filename pattern may create many duplicates. Consider adding {name} or {index}.', action: { type: 'set-pattern', label: 'Use safer pattern', pattern: '{name}-{index}' } });
  if (args.patternWarnings?.some((w) => w.includes('{custom}'))) notes.push({ text: 'Add custom text or remove {custom} from the pattern.', action: { type: 'set-pattern', label: 'Use {name} pattern', pattern: '{name}' } });
  if (args.patternWarnings?.some((w) => w.includes('{prefix}'))) notes.push({ text: 'Add a prefix or remove {prefix} from the pattern.', action: { type: 'set-pattern', label: 'Use {name} pattern', pattern: '{name}' } });
  return notes;
}

export function computeFormatMix(rows: PreviewRow[]): Record<OutputFormat, number> {
  return rows.reduce((acc, r) => ({ ...acc, [r.targetFormat]: (acc[r.targetFormat] ?? 0) + 1 }), { webp: 0, avif: 0, jpeg: 0, png: 0 } as Record<OutputFormat, number>);
}
