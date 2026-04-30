import type { GuiOptions } from '../types.js';

interface SettingsPanelProps {
  options: GuiOptions;
  onChange: (next: GuiOptions) => void;
  disabled: boolean;
}

export default function SettingsPanel({ options, onChange, disabled }: SettingsPanelProps): JSX.Element {
  return (
    <section className="panel">
      <h2>Settings</h2>
      <div className="grid">
        <label>Prefix<input disabled={disabled} value={options.prefix ?? ''} onChange={(e) => onChange({ ...options, prefix: e.target.value })} /></label>
        <label>Custom token<input disabled={disabled} value={options.custom ?? ''} onChange={(e) => onChange({ ...options, custom: e.target.value })} /></label>
        <label>Pattern<input disabled={disabled} value={options.pattern} onChange={(e) => onChange({ ...options, pattern: e.target.value })} /></label>
        <label>Quality<input disabled={disabled} type="number" min={1} max={100} step={1} value={options.quality} onChange={(e) => onChange({ ...options, quality: Number(e.target.value) })} /></label>
        <label>Alpha quality<input disabled={disabled} type="number" min={0} max={100} step={1} value={options.alphaQuality} onChange={(e) => onChange({ ...options, alphaQuality: Number(e.target.value) })} /></label>
        <label>Max width<input disabled={disabled} type="number" min={1} step={1} value={options.maxWidth ?? ''} onChange={(e) => onChange({ ...options, maxWidth: e.target.value ? Number(e.target.value) : undefined })} /></label>
        <label>Max height<input disabled={disabled} type="number" min={1} step={1} value={options.maxHeight ?? ''} onChange={(e) => onChange({ ...options, maxHeight: e.target.value ? Number(e.target.value) : undefined })} /></label>
      </div>
      <div className="checks">
        <label><input disabled={disabled} type="checkbox" checked={options.recursive} onChange={(e) => onChange({ ...options, recursive: e.target.checked })} /> Recursive</label>
        <label><input disabled={disabled} type="checkbox" checked={options.lossless} onChange={(e) => onChange({ ...options, lossless: e.target.checked })} /> Lossless</label>
        <label><input disabled={disabled} type="checkbox" checked={options.keepMetadata} onChange={(e) => onChange({ ...options, keepMetadata: e.target.checked })} /> Keep metadata</label>
      </div>
    </section>
  );
}
