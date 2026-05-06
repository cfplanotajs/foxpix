import { slugify } from '../../core/slugify.js';
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

export default function SettingsPanel({ options, onChange, disabled, selectedPreset, onPresetChange }: SettingsPanelProps): JSX.Element {
  return (<section className="panel"><h2>Settings</h2><p className="hint">{`{name}`} = original filename made web-safe.</p><div className="grid">
    <label>Preset<select disabled={disabled} value={selectedPreset} onChange={(e) => onPresetChange(e.target.value as WorkflowPresetId)}>
      <option value="web-safe-original">Web-safe original names</option><option value="shopify-transparent">Shopify transparent assets</option><option value="product-listing">Product listing images</option><option value="tiny-web">Tiny web assets</option><option value="lossless-archive">Lossless archive</option><option value="custom">Custom</option>
    </select></label>
    <label>Prefix<input disabled={disabled} value={options.prefix ?? ''} onChange={(e) => onChange({ ...options, prefix: e.target.value })} /></label>
    <label>Custom text token<input disabled={disabled} value={options.custom ?? ''} onChange={(e) => onChange({ ...options, custom: e.target.value })} /><small>Used only when the pattern contains {'{custom}'}.</small></label>
    <label>Filename pattern<input disabled={disabled} value={options.pattern} onChange={(e) => onChange({ ...options, pattern: e.target.value })} /><small>Use tokens like {'{name}'}, {'{prefix}'}, {'{index}'}, {'{folder}'}, {'{custom}'}.</small></label>
    <label>Quality<input disabled={disabled} type="number" min={1} max={100} step={1} value={options.quality} onChange={(e) => onChange({ ...options, quality: Number(e.target.value) })} /></label>
    <label>Alpha quality<input disabled={disabled} type="number" min={0} max={100} step={1} value={options.alphaQuality} onChange={(e) => onChange({ ...options, alphaQuality: Number(e.target.value) })} /></label>
    <label>Max width<input disabled={disabled} type="number" min={1} step={1} value={options.maxWidth ?? ''} onChange={(e) => onChange({ ...options, maxWidth: e.target.value ? Number(e.target.value) : undefined })} /></label>
    <label>Max height<input disabled={disabled} type="number" min={1} step={1} value={options.maxHeight ?? ''} onChange={(e) => onChange({ ...options, maxHeight: e.target.value ? Number(e.target.value) : undefined })} /></label>
  </div><p className="hint">Example: "My Cute Animal.png" → "{exampleName(options)}"</p><p className="hint">Preview checks names before writing files. Process converts images and writes manifests.</p><div className="checks"><label><input disabled={disabled} type="checkbox" checked={options.recursive} onChange={(e) => onChange({ ...options, recursive: e.target.checked })} /> Recursive</label><label><input disabled={disabled} type="checkbox" checked={options.lossless} onChange={(e) => onChange({ ...options, lossless: e.target.checked })} /> Lossless</label><label><input disabled={disabled} type="checkbox" checked={options.keepMetadata} onChange={(e) => onChange({ ...options, keepMetadata: e.target.checked })} /> Keep metadata</label></div></section>);
}
