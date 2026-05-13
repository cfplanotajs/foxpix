import { normalizeOutputFormat, type OutputFormat } from '../types/index.js';

export function extensionForOutputFormat(format: OutputFormat | undefined): 'webp' | 'avif' | 'jpg' | 'png' {
  const normalized = normalizeOutputFormat(format);
  if (normalized === 'avif') return 'avif';
  if (normalized === 'jpeg') return 'jpg';
  if (normalized === 'png') return 'png';
  return 'webp';
}
