import { extensionForOutputFormat } from '../core/outputFormat.js';
import { slugify } from '../core/slugify.js';
import type { OutputFormat } from '../types/index.js';

export function buildPatternExample(args: { pattern: string; prefix?: string; custom?: string; outputFormat?: OutputFormat; sampleName?: string; sampleFolder?: string; index?: number }): string {
  const sampleName = args.sampleName ?? 'My Cute Animal';
  const sampleFolder = args.sampleFolder ?? 'product-shots';
  const index = String(args.index ?? 1).padStart(3, '0');
  const prefix = (args.prefix && /[a-z0-9]/i.test(args.prefix)) ? slugify(args.prefix) : slugify(sampleName);
  const custom = (args.custom && /[a-z0-9]/i.test(args.custom)) ? slugify(args.custom) : '';
  const base = args.pattern
    .replaceAll('{name}', slugify(sampleName))
    .replaceAll('{prefix}', prefix)
    .replaceAll('{index}', index)
    .replaceAll('{folder}', slugify(sampleFolder))
    .replaceAll('{custom}', custom);
  const safe = /[a-z0-9]/i.test(base) ? slugify(base) : `image-${index}`;
  return `${safe}.${extensionForOutputFormat(args.outputFormat ?? 'webp')}`;
}

export function getPatternWarnings(args: { pattern: string; prefix?: string; custom?: string }): string[] {
  const w: string[] = [];
  const p = args.pattern.trim();
  if (!p) w.push('Pattern is empty.');
  const known = ['name', 'prefix', 'index', 'folder', 'custom'];
  const tokens = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  const unknown = tokens.filter((t) => !known.includes(t));
  if (unknown.length > 0) w.push(`Unknown token(s): ${unknown.map((t) => `{${t}}`).join(', ')}.`);
  if (p.includes('{prefix}') && !(args.prefix && /[a-z0-9]/i.test(args.prefix))) w.push('Add a prefix or remove {prefix} from the pattern.');
  if (p.includes('{custom}') && !(args.custom && /[a-z0-9]/i.test(args.custom))) w.push('Add custom text or remove {custom} from the pattern.');
  if (!p.includes('{name}') && !p.includes('{index}') && !p.includes('{folder}')) w.push('This pattern may create many duplicates. FoxPix will add safe suffixes.');
  if (!/[a-z0-9{}]/i.test(p)) w.push('Pattern is punctuation-only and may fall back to safe indexed names.');
  return w;
}
