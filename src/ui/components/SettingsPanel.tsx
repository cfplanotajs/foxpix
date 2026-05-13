import { slugify } from '../../core/slugify.js';
import { workflowPresets } from '../../core/presets.js';
import type { GuiOptions, WorkflowPresetId } from '../types.js';

interface SettingsPanelProps {
  options: GuiOptions;
  onChange: (next: GuiOptions) => void;
  disabled: boolean;
  selectedPreset: WorkflowPresetId;
  onPresetChange: (preset: WorkflowPresetId) => void;
}

function exampleName(options: GuiOptions): string {
  const sample = 'My Cute Animal';
  const prefix = slugify((options.prefix || '').trim()) || 'my-cute-animal';
  const custom = slugify((options.custom || '').trim());
  const resolved = options.pattern.replaceAll('{name}', slugify(sample)).replaceAll('{prefix}', prefix).replaceAll('{index}', '001').replaceAll('{folder}', 'stickers').replaceAll('{custom}', custom);
  return `${slugify(resolved || sample)}.webp`;
}

const presetHelp: Record<Exclude<WorkflowPresetId, 'custom'>, string> = {
  'web-safe-original': 'Keeps source naming intent while producing web-safe filenames and balanced compression.',
  'shopify-transparent': 'Good default for transparent product/sticker assets with high alpha fidelity.',
  'product-listing': 'Preset tuned for standard product listing images and general storefront use.',
  'tiny-web': 'Smaller output bias for lightweight web usage and quick page loads.',
  'lossless-archive': 'Lossless export profile for archival or no-quality-loss workflows.'
};

export default function SettingsPanel({ options, onChange, disabled, selectedPreset, onPresetChange }: SettingsPanelProps): JSX.Element {
  const presetText = selectedPreset === 'custom' ? 'Custom settings mode. Adjust values below.' : presetHelp[selectedPreset];
  return (<section className="panel"><h2>Rename + compression settings</h2><p className="hint">{presetText}</p><div className="grid">
    <label>Preset<select disabled={disabled} value={selectedPreset} onChange={(e) => onPresetChange(e.target.value as WorkflowPresetId)}>
      <option value="web-safe-original">Web-safe original names</option><option value="shopify-transparent">Shopify transparent assets</option><option value="product-listing">Product listing images</option><option value="tiny-web">Tiny web assets</option><option value="lossless-archive">Lossless archive</option><option value="custom">Custom</option>
    </select></label>
    <label>Output format<select disabled={disabled} value={options.outputFormat ?? 'webp'} onChange={(e) => onChange({ ...options, outputFormat: e.target.value as GuiOptions['outputFormat'] })}><option value="webp">WebP — recommended</option><option value="avif">AVIF — smaller, slower</option><option value="jpeg">JPEG — photos only, no transparency</option><option value="png">PNG — lossless/transparency-safe</option></select><small>Choose the format FoxPix will create. WebP is recommended for most web assets.</small></label>
    <label>Prefix<input disabled={disabled} value={options.prefix ?? ''} onChange={(e) => onChange({ ...options, prefix: e.target.value })} /></label>
    <label>Custom text token<input disabled={disabled} value={options.custom ?? ''} onChange={(e) => onChange({ ...options, custom: e.target.value })} /></label>
    <label>Filename pattern<input disabled={disabled} value={options.pattern} onChange={(e) => onChange({ ...options, pattern: e.target.value })} /></label>
    <div className="token-help"><strong>Pattern tokens</strong><ul>
      <li><code>{'{name}'}</code> = original filename made web-safe</li>
      <li><code>{'{prefix}'}</code> = prefix text</li>
      <li><code>{'{index}'}</code> = 001, 002, 003</li>
      <li><code>{'{folder}'}</code> = source folder name</li>
      <li><code>{'{custom}'}</code> = custom text token</li>
    </ul></div>
    <label>Quality<input disabled={disabled} type="number" min={1} max={100} step={1} value={options.quality} onChange={(e) => onChange({ ...options, quality: Number(e.target.value) })} /></label>
    <label>Alpha quality<input disabled={disabled} type="number" min={0} max={100} step={1} value={options.alphaQuality} onChange={(e) => onChange({ ...options, alphaQuality: Number(e.target.value) })} /></label>
    <label>WebP effort<input disabled={disabled} type="number" min={0} max={6} step={1} value={options.effort} onChange={(e) => onChange({ ...options, effort: Number(e.target.value) })} /><small>0 fastest, 6 smaller/slower.</small></label>
    <label>Max width<input disabled={disabled} type="number" min={1} step={1} value={options.maxWidth ?? ''} onChange={(e) => onChange({ ...options, maxWidth: e.target.value ? Number(e.target.value) : undefined })} /></label>
    <label>Max height<input disabled={disabled} type="number" min={1} step={1} value={options.maxHeight ?? ''} onChange={(e) => onChange({ ...options, maxHeight: e.target.value ? Number(e.target.value) : undefined })} /></label>
  </div>{(options.outputFormat ?? 'webp') === 'jpeg' ? <p className="hint warn">JPEG does not support transparency. Transparent files will be blocked. Use WebP, AVIF, or PNG for transparent assets.</p> : null}<p className="hint">Example: "My Cute Animal.png" → "{exampleName(options)}"</p><p className="hint">Preview checks names before writing files. Process writes optimized WebP files and manifests.</p><div className="checks"><label><input disabled={disabled} type="checkbox" checked={options.recursive} onChange={(e) => onChange({ ...options, recursive: e.target.checked })} /> Recursive</label><label><input disabled={disabled} type="checkbox" checked={options.lossless} onChange={(e) => onChange({ ...options, lossless: e.target.checked })} /> Lossless</label><label><input disabled={disabled} type="checkbox" checked={options.keepMetadata} onChange={(e) => onChange({ ...options, keepMetadata: e.target.checked })} /> Keep metadata</label></div></section>);
}
