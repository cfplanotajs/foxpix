import type { OutputFormat } from '../types/index.js';
import type { RecommendationAction } from './recommendations.js';
import type { ReviewFilter } from './reviewState.js';
import type { GuiOptions, PreviewRow } from './types.js';

export type RecommendationUndoSnapshot = { options?: Pick<GuiOptions, 'pattern' | 'outputFormat'>; includedMap?: Record<string, boolean>; formatOverrides?: Record<string, OutputFormat>; activeFilter?: ReviewFilter };
export type RecommendationActionResult = { status: string; nextOptions?: Partial<GuiOptions>; nextIncludedMap?: Record<string, boolean>; nextFormatOverrides?: Record<string, OutputFormat>; nextFilter?: ReviewFilter; clearEstimates?: boolean; clearStudioPreview?: boolean; shouldRunEstimate?: boolean; undoSnapshot?: RecommendationUndoSnapshot };

export function executeRecommendationAction(args: { action: RecommendationAction; rows: PreviewRow[]; includedMap: Record<string, boolean>; formatOverrides: Record<string, OutputFormat>; options: GuiOptions; activeFilter: ReviewFilter }): RecommendationActionResult {
  const { action, rows, includedMap, formatOverrides, options, activeFilter } = args;
  if (action.type === 'run-estimate') return { status: 'Estimate Sizes started.', shouldRunEstimate: true };
  if (action.type === 'set-review-filter' && action.filter) return { status: action.filter === 'renamed' ? 'Showing renamed files.' : action.filter === 'larger' ? 'Showing larger-than-original files.' : `Showing ${action.filter} files.`, nextFilter: action.filter };
  if (action.type === 'select-all') return { status: 'Selected all rows.', nextIncludedMap: Object.fromEntries(rows.map((r) => [r.id, true])), clearEstimates: true, undoSnapshot: { includedMap, activeFilter } };
  if (action.type === 'set-pattern' && action.pattern) return { status: 'Pattern updated. Click Preview again.', nextOptions: { pattern: action.pattern }, clearEstimates: true, clearStudioPreview: true, undoSnapshot: { options: { pattern: options.pattern }, activeFilter } };
  if (action.type === 'set-risky-jpeg-rows-to-webp') {
    const risky = rows.filter((r) => includedMap[r.id] !== false && (r.error ?? '').includes('JPEG does not support transparency'));
    if (risky.length === 0) return { status: 'No risky JPEG rows found.' };
    const next = { ...formatOverrides };
    risky.forEach((r) => { next[r.id] = 'webp'; });
    return { status: 'Risky JPEG rows switched to WebP. Estimate Sizes again.', nextFormatOverrides: next, clearEstimates: true, clearStudioPreview: true, undoSnapshot: { formatOverrides, activeFilter } };
  }
  return { status: 'No action performed.' };
}

export function undoRecommendationAction(snapshot: RecommendationUndoSnapshot): RecommendationActionResult {
  return { status: 'Undid last recommendation action.', nextOptions: snapshot.options, nextIncludedMap: snapshot.includedMap, nextFormatOverrides: snapshot.formatOverrides, nextFilter: snapshot.activeFilter };
}
