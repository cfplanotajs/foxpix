import { useEffect, useMemo, useState } from 'react';
import FolderPicker from './components/FolderPicker.js';
import SettingsPanel from './components/SettingsPanel.js';
import PreviewTable from './components/PreviewTable.js';
import SummaryPanel from './components/SummaryPanel.js';
import ProgressPanel from './components/ProgressPanel.js';
import type { PreviewRow, GuiOptions, WorkflowPresetId } from './types.js';
import type { ProcessingSummary } from '../types/index.js';
import { workflowPresets } from '../core/presets.js';

const defaults: GuiOptions = { input: '', output: '', prefix: '', pattern: '{name}', custom: '', quality: 85, alphaQuality: 100, lossless: false, recursive: false, keepMetadata: false };
const bridgeMsg = 'FoxPix desktop bridge is unavailable. Launch the app with npm run dev:gui or npm run start:gui, not directly in a browser.';

function toMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function validateOptions(options: GuiOptions): string | null { if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) return 'Quality must be an integer between 1 and 100.'; if (!Number.isInteger(options.alphaQuality) || options.alphaQuality < 0 || options.alphaQuality > 100) return 'Alpha quality must be an integer between 0 and 100.'; if (options.maxWidth !== undefined && (!Number.isInteger(options.maxWidth) || options.maxWidth < 1)) return 'Max width must be a positive integer when provided.'; if (options.maxHeight !== undefined && (!Number.isInteger(options.maxHeight) || options.maxHeight < 1)) return 'Max height must be a positive integer when provided.'; return null; }

export default function App(): JSX.Element {
  const [options, setOptions] = useState<GuiOptions>(defaults);
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPresetId>('web-safe-original');
  const [outputTouched, setOutputTouched] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [manifestPath, setManifestPath] = useState('');
  const [manifestCsvPath, setManifestCsvPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [dragOver, setDragOver] = useState(false);
  const bridgeAvailable = typeof window !== 'undefined' && typeof window.foxpix !== 'undefined';
  const outputDisplay = useMemo(() => options.output || (options.input ? `${options.input}/optimized` : ''), [options.input, options.output]);
  const validationError = validateOptions(options);
  const bridgeError = bridgeAvailable ? null : bridgeMsg;

  useEffect(() => { if (!bridgeAvailable) return; void window.foxpix.loadSettings().then((saved) => { if (!saved) return; setOptions((prev) => ({ ...prev, ...saved })); if (saved.outputTouched) setOutputTouched(true); if (saved.selectedPreset) setSelectedPreset(saved.selectedPreset as WorkflowPresetId); }).catch(() => {}); }, [bridgeAvailable]);
  useEffect(() => { if (!bridgeAvailable) return; const t = setTimeout(() => { void window.foxpix.saveSettings({ ...options, outputTouched, selectedPreset }); }, 200); return () => clearTimeout(t); }, [bridgeAvailable, options, outputTouched, selectedPreset]);

  const applyPreset = (preset: WorkflowPresetId): void => { setSelectedPreset(preset); if (preset === 'custom') return; setOptions((prev) => ({ ...prev, ...workflowPresets[preset] })); };
  const onOptionsChange = (next: GuiOptions): void => { setOptions(next); const base = selectedPreset === 'custom' ? null : workflowPresets[selectedPreset as Exclude<WorkflowPresetId, 'custom'>]; if (base && (next.pattern !== (base.pattern ?? next.pattern) || next.quality !== (base.quality ?? next.quality) || next.alphaQuality !== (base.alphaQuality ?? next.alphaQuality) || next.lossless !== (base.lossless ?? next.lossless) || next.keepMetadata !== (base.keepMetadata ?? next.keepMetadata))) setSelectedPreset('custom'); };

  const pickInput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectInputFolder(); if (!picked) return; setOptions((prev) => outputTouched ? { ...prev, input: picked } : { ...prev, input: picked, output: `${picked}/optimized` }); setStatus('Folder loaded. Click Preview to continue.'); };
  const pickOutput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectOutputFolder(); if (picked) { setOptions((prev) => ({ ...prev, output: picked })); setOutputTouched(true); } };

  const handlePreview = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); setBusy(true); setStatus('Preparing preview...'); try { const result = await window.foxpix.preview({ ...options, output: options.output || undefined }); setPreviewRows(result.rows); setStatus(`Preview ready (${result.total} files).`); } catch (error) { setStatus(`Preview failed: ${toMessage(error)}`); } finally { setBusy(false); } };
  const handleProcess = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); setBusy(true); setStatus('Processing batch...'); try { const result = await window.foxpix.process({ ...options, output: options.output || undefined }); setSummary(result.summary); setManifestPath(result.manifestPath); setManifestCsvPath(result.manifestCsvPath); setStatus(`Completed: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.`); } catch (error) { setStatus(`Processing failed: ${toMessage(error)}`); } finally { setBusy(false); } };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault(); setDragOver(false);
    const file = event.dataTransfer.files?.[0]; if (!file) return;
    if (!bridgeAvailable) return void setStatus(bridgeMsg);
    const resolved = await window.foxpix.resolveDroppedPath(file); if (!resolved) return void setStatus('Please drop a folder, not individual files.');
    const preview = await window.foxpix.preview({ ...options, input: resolved, output: outputTouched ? options.output || undefined : `${resolved}/optimized` });
    if (!preview) return;
    setOptions((prev) => outputTouched ? { ...prev, input: resolved } : { ...prev, input: resolved, output: `${resolved}/optimized` });
    setStatus('Folder loaded. Click Preview to continue.');
  };

  return (<main className="app">
    <section className="left">
      <h1>FoxPix</h1><p className="tagline">Batch rename, compress, and convert web assets.</p>
      <FolderPicker input={options.input} output={outputDisplay} onInputPick={pickInput} onOutputPick={pickOutput} disabled={busy || !bridgeAvailable} />
      <div className={`panel dropzone ${dragOver ? 'drag-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => void onDrop(e)}><strong>Drop folder here</strong><p>Drag a folder to set input quickly.</p></div>
      <SettingsPanel options={options} onChange={onOptionsChange} disabled={busy} selectedPreset={selectedPreset} onPresetChange={applyPreset} />
      <div className="actions">
        <button type="button" onClick={() => void handlePreview()} disabled={busy || !bridgeAvailable || !options.input || Boolean(validationError)}>Preview (dry run)</button>
        <button type="button" onClick={() => void handleProcess()} disabled={busy || !bridgeAvailable || !options.input || Boolean(validationError)}>Process</button>
        <button type="button" onClick={() => void (async () => { if (!bridgeAvailable) return void setStatus(bridgeMsg); const result = await window.foxpix.openFolder(outputDisplay); if (!result.ok) setStatus(`Open folder failed: ${result.error}`); })()} disabled={!bridgeAvailable || !outputDisplay}>Open output folder</button>
      </div>
    </section>
    <section className="right">
      <ProgressPanel busy={busy} label={bridgeError ?? validationError ?? status} />
      <PreviewTable rows={previewRows} />
      <SummaryPanel summary={summary} manifestPath={manifestPath} manifestCsvPath={manifestCsvPath} outputFolder={outputDisplay} onOpenPath={async (p) => { const r = await window.foxpix.openFolder(p); if (!r.ok) setStatus(`Open failed: ${r.error}`); }} />
    </section>
  </main>);
}
