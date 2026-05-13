import { useEffect, useMemo, useState } from 'react';
import FolderPicker from './components/FolderPicker.js';
import SettingsPanel from './components/SettingsPanel.js';
import PreviewTable from './components/PreviewTable.js';
import SummaryPanel from './components/SummaryPanel.js';
import ProgressPanel from './components/ProgressPanel.js';
import type { PreviewRow, GuiOptions, WorkflowPresetId } from './types.js';
import type { ProcessingSummary } from '../types/index.js';
import { workflowPresets } from '../core/presets.js';

const defaults: GuiOptions = { input: '', filePaths: [], output: '', prefix: '', pattern: '{name}', custom: '', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false };
const bridgeMsg = 'FoxPix desktop bridge is unavailable. Launch the app with npm run dev:gui or npm run start:gui, not directly in a browser.';

function toMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function validateOptions(options: GuiOptions): string | null { if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) return 'Quality must be an integer between 1 and 100.'; if (!Number.isInteger(options.alphaQuality) || options.alphaQuality < 0 || options.alphaQuality > 100) return 'Alpha quality must be an integer between 0 and 100.'; if (!Number.isInteger(options.effort) || options.effort < 0 || options.effort > 6) return 'WebP effort must be an integer between 0 and 6.'; if (options.maxWidth !== undefined && (!Number.isInteger(options.maxWidth) || options.maxWidth < 1)) return 'Max width must be a positive integer when provided.'; if (options.maxHeight !== undefined && (!Number.isInteger(options.maxHeight) || options.maxHeight < 1)) return 'Max height must be a positive integer when provided.'; return null; }

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
  const outputDisplay = useMemo(() => options.output || '', [options.output]);
  const validationError = validateOptions(options);
  const bridgeError = bridgeAvailable ? null : bridgeMsg;
  const mode: 'folder' | 'files' | 'none' = options.filePaths && options.filePaths.length > 0 ? 'files' : options.input ? 'folder' : 'none';

  useEffect(() => { if (!bridgeAvailable) return; void window.foxpix.loadSettings().then((saved) => { if (!saved) return; setOptions((prev) => ({ ...prev, ...saved })); if (saved.outputTouched) setOutputTouched(true); if (saved.selectedPreset) setSelectedPreset(saved.selectedPreset as WorkflowPresetId); }).catch(() => {}); }, [bridgeAvailable]);
  useEffect(() => { if (!bridgeAvailable) return; const t = setTimeout(() => { void window.foxpix.saveSettings({ ...options, outputTouched, selectedPreset }); }, 200); return () => clearTimeout(t); }, [bridgeAvailable, options, outputTouched, selectedPreset]);

  const applyPreset = (preset: WorkflowPresetId): void => { setSelectedPreset(preset); if (preset === 'custom') return; setOptions((prev) => ({ ...prev, ...workflowPresets[preset] })); };
  const onOptionsChange = (next: GuiOptions): void => { setOptions(next); const base = selectedPreset === 'custom' ? null : workflowPresets[selectedPreset as Exclude<WorkflowPresetId, 'custom'>]; if (base && (next.pattern !== (base.pattern ?? next.pattern) || next.quality !== (base.quality ?? next.quality) || next.alphaQuality !== (base.alphaQuality ?? next.alphaQuality) || next.lossless !== (base.lossless ?? next.lossless) || next.effort !== (base.effort ?? next.effort) || next.keepMetadata !== (base.keepMetadata ?? next.keepMetadata))) setSelectedPreset('custom'); };

  const pickInput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectInputFolder(); if (!picked) return; setOptions((prev) => outputTouched ? { ...prev, input: picked, filePaths: [] } : { ...prev, input: picked, filePaths: [], output: '' }); setStatus('Folder selected. Click Preview to check output names.'); };
  const pickOutput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectOutputFolder(); if (picked) { setOptions((prev) => ({ ...prev, output: picked })); setOutputTouched(true); setStatus('Output folder selected.'); } };
  const pickFiles = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectImageFiles(); if (!picked || picked.length === 0) return; setOptions((prev) => ({ ...prev, filePaths: picked, input: undefined, output: outputTouched ? prev.output : '' })); setStatus(`Selected files: ${picked.length}`); };

  const handlePreview = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); setBusy(true); setStatus('Preparing preview...'); try { const result = await window.foxpix.preview({ ...options, output: options.output || undefined }); setPreviewRows(result.rows); setOptions((prev) => ({ ...prev, output: result.outputFolder })); setStatus(result.total === 0 ? 'No supported files found in this source.' : `Preview ready (${result.total} files).`); } catch (error) { setStatus(`Preview failed: ${toMessage(error)}`); } finally { setBusy(false); } };
  const handleProcess = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); setBusy(true); setStatus('Processing batch...'); try { const result = await window.foxpix.process({ ...options, output: options.output || undefined }); setSummary(result.summary); setManifestPath(result.manifestPath); setManifestCsvPath(result.manifestCsvPath); setOptions((prev) => ({ ...prev, output: result.outputFolder })); setStatus(result.summary.failed > 0 ? `Completed with warnings: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.` : `Completed: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.`); } catch (error) { setStatus(`Processing failed: ${toMessage(error)}`); } finally { setBusy(false); } };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    setDragOver(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (dropped.length === 0) return;
    if (!bridgeAvailable) {
      setStatus(bridgeMsg);
      return;
    }

    setBusy(true);
    try {
      const resolved = await window.foxpix.resolveDroppedItems(dropped);
      if (resolved.kind === 'invalid') {
        setStatus(resolved.error);
        return;
      }

      if (resolved.kind === 'folder') {
        const result = await window.foxpix.preview({ ...options, input: resolved.path, filePaths: [], output: outputTouched ? options.output || undefined : undefined });
        setPreviewRows(result.rows);
        setOptions((prev) => ({ ...prev, input: resolved.path, filePaths: [], output: result.outputFolder }));
        setStatus(result.total === 0 ? 'No supported files found in dropped folder.' : `Preview ready (${result.total} files).`);
        return;
      }

      const result = await window.foxpix.preview({ ...options, input: undefined, filePaths: resolved.paths, output: outputTouched ? options.output || undefined : undefined });
      setPreviewRows(result.rows);
      setOptions((prev) => ({ ...prev, input: undefined, filePaths: resolved.paths, output: result.outputFolder }));
      setStatus(`Preview ready (${result.total} selected files).`);
    } catch (error) {
      setStatus(`Drop preview failed: ${toMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (<main className="app">
    <section className="topbar panel">
      <div>
        <h1>FoxPix</h1>
        <p className="tagline">Batch rename, compress, and convert web assets.</p>
      </div>
      <div className="badges"><span className="pill">Local-only</span><span className="pill">Transparency-safe</span><span className="pill">WebP-ready</span></div>
    </section>
    <section className="left">
      <section className="panel stepper"><h2>Workflow</h2><ol><li>Source</li><li>Rename</li><li>Preview</li><li>Process</li><li>Export</li></ol></section>
      <FolderPicker input={options.input || ''} output={outputDisplay} mode={mode} selectedFileCount={options.filePaths?.length ?? 0} onInputPick={pickInput} onOutputPick={pickOutput} disabled={busy || !bridgeAvailable} />
      <div className="actions"><button type="button" className="secondary" onClick={() => void pickFiles()} disabled={busy || !bridgeAvailable}>Choose Image File(s)</button></div>
      <div className={`panel dropzone ${dragOver ? 'drag-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => void onDrop(e)}><strong>Drop a folder or multiple image files</strong><p>Drag a folder for folder mode, or drag supported files for selected-files mode.</p></div>
      <SettingsPanel options={options} onChange={onOptionsChange} disabled={busy} selectedPreset={selectedPreset} onPresetChange={applyPreset} />
      <div className="actions sticky-actions">
        <button type="button" onClick={() => void handlePreview()} disabled={busy || !bridgeAvailable || !(options.input || (options.filePaths && options.filePaths.length > 0)) || Boolean(validationError)} className="secondary">Preview (dry run)</button>
        <button type="button" onClick={() => void handleProcess()} disabled={busy || !bridgeAvailable || !(options.input || (options.filePaths && options.filePaths.length > 0)) || Boolean(validationError)} className="primary">Process</button>
        <button type="button" onClick={() => void (async () => { if (!bridgeAvailable) return void setStatus(bridgeMsg); const result = await window.foxpix.openFolder(outputDisplay); if (!result.ok) setStatus(`Open output folder failed. ${result.error}`); })()} disabled={!bridgeAvailable || !outputDisplay} className="secondary">Open output folder</button>
      </div>
    </section>
    <section className="right">
      <ProgressPanel busy={busy} label={bridgeError ?? validationError ?? status} />
      <PreviewTable rows={previewRows} />
      <SummaryPanel summary={summary} manifestPath={manifestPath} manifestCsvPath={manifestCsvPath} outputFolder={outputDisplay} onOpenPath={async (p) => { const r = await window.foxpix.openFolder(p); if (!r.ok) setStatus(`Open failed. ${r.error}`); }} />
    </section>
  </main>);
}
