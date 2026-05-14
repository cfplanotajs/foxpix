import { useEffect, useMemo, useState } from 'react';
import FolderPicker from './components/FolderPicker.js';
import SettingsPanel from './components/SettingsPanel.js';
import PreviewTable from './components/PreviewTable.js';
import SummaryPanel from './components/SummaryPanel.js';
import ProgressPanel from './components/ProgressPanel.js';
import type { PreviewRow, GuiOptions, WorkflowPresetId, StoredGuiSettings } from './types.js';
import { DEFAULT_OUTPUT_FORMAT, normalizeOutputFormat, type ProcessingSummary } from '../types/index.js';
import { workflowPresets } from '../core/presets.js';
import { applyBulkIncludedOverrides, getEffectiveOutputFormat, resetAllOverrides } from './formatOverrides.js';
import { computeReviewCounts } from './reviewState.js';
import { buildRecommendations, computeFormatMix } from './recommendations.js';
import type { ReviewFilter } from './reviewState.js';
import { clearRecentPaths, pushRecentPath } from './recentPaths.js';
import { sanitizeRecentPaths } from './recentPaths.js';
import { getActionAvailability } from './actionAvailability.js';
import { deletePreset, getPresetMatchState, mergeImportedPresets, parsePresetPack, renamePreset, sanitizeCustomPresets, savePreset, serializePresetPack, type CustomPreset } from './customPresets.js';
import { getPatternWarnings } from './patternAssistant.js';
import { executeRecommendationAction, undoRecommendationAction, type RecommendationUndoSnapshot } from './recommendationActions.js';

const defaults: GuiOptions = { input: '', filePaths: [], output: '', prefix: '', pattern: '{name}', custom: '', quality: 85, alphaQuality: 100, effort: 4, lossless: false, recursive: false, keepMetadata: false, outputFormat: DEFAULT_OUTPUT_FORMAT };
const bridgeMsg = 'FoxPix desktop bridge is unavailable. Launch the app with npm run dev:gui or npm run start:gui, not directly in a browser.';

function toMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function isBuiltInPreset(value: WorkflowPresetId): value is Exclude<WorkflowPresetId, 'custom' | `custom:${string}`> { return !value.startsWith('custom') && value !== 'custom'; }
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
  const [estimateTotals, setEstimateTotals] = useState<{ totalOriginalBytes: number; totalEstimatedOutputBytes: number; totalEstimatedSavedBytes: number; totalEstimatedSavedPercent: number; estimatedCount: number; failedCount: number } | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [studioPreview, setStudioPreview] = useState<any>(null);
  const [includedMap, setIncludedMap] = useState<Record<string, boolean>>({});
  const [formatOverrides, setFormatOverrides] = useState<Record<string, any>>({});
  const [visibleRowIds, setVisibleRowIds] = useState<string[]>([]);
  const [thumbnailMap, setThumbnailMap] = useState<Record<string, { dataUrl?: string; loading?: boolean; error?: string; hasAlpha?: boolean }>>({});
  const [estimatesStale, setEstimatesStale] = useState(false);
  const [recentInputs, setRecentInputs] = useState<string[]>([]);
  const [recentOutputs, setRecentOutputs] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [outputFolderStatus, setOutputFolderStatus] = useState<{ status: string; path: string; error?: string } | null>(null);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState<ReviewFilter>('all');
  const [undoSnapshot, setUndoSnapshot] = useState<RecommendationUndoSnapshot | null>(null);
  const bridgeAvailable = typeof window !== 'undefined' && typeof window.foxpix !== 'undefined';
  const outputDisplay = useMemo(() => options.output || '', [options.output]);
  const validationError = validateOptions(options);
  const bridgeError = bridgeAvailable ? null : bridgeMsg;
  const mode: 'folder' | 'files' | 'none' = options.filePaths && options.filePaths.length > 0 ? 'files' : options.input ? 'folder' : 'none';

  useEffect(() => { if (!bridgeAvailable) return; void window.foxpix.loadSettings().then((saved: StoredGuiSettings | null) => { if (!saved) return; setOptions((prev) => ({ ...prev, ...saved, outputFormat: normalizeOutputFormat(saved.outputFormat) })); if (saved.outputTouched) setOutputTouched(true); if (saved.selectedPreset) setSelectedPreset(saved.selectedPreset as WorkflowPresetId); setRecentInputs(sanitizeRecentPaths(saved.recentInputs)); setRecentOutputs(sanitizeRecentPaths(saved.recentOutputs)); setCustomPresets(sanitizeCustomPresets(saved.customPresets)); }).catch(() => {}); }, [bridgeAvailable]);
  useEffect(() => { if (!bridgeAvailable) return; const t = setTimeout(() => { void window.foxpix.saveSettings({ ...options, outputTouched, selectedPreset, recentInputs, recentOutputs, customPresets }); }, 200); return () => clearTimeout(t); }, [bridgeAvailable, options, outputTouched, selectedPreset, recentInputs, recentOutputs, customPresets]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      const availability = getActionAvailability({ bridgeAvailable, busy, hasSource: Boolean(options.input || (options.filePaths?.length ?? 0) > 0), hasPreviewRows: previewRows.length > 0, includedCount: previewRows.filter((r) => includedMap[r.id] !== false).length, hasInvalidSettings: Boolean(validationError) });
      if (e.ctrlKey && e.key.toLowerCase() === 'o' && !e.shiftKey) { e.preventDefault(); void pickInput(); }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); void pickFiles(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'p' && availability.preview.enabled) { e.preventDefault(); void handlePreview(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'e' && availability.estimate.enabled) { e.preventDefault(); void handleEstimate(); }
      if (e.ctrlKey && e.key === 'Enter' && availability.process.enabled) { e.preventDefault(); void handleProcess(); }
      if (e.key === 'Escape') setStudioPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bridgeAvailable, busy, options, previewRows, includedMap, validationError]);
  const availability = getActionAvailability({ bridgeAvailable, busy, hasSource: Boolean(options.input || (options.filePaths?.length ?? 0) > 0), hasPreviewRows: previewRows.length > 0, includedCount: previewRows.filter((r) => includedMap[r.id] !== false).length, hasInvalidSettings: Boolean(validationError) });
  const presetMatch = getPresetMatchState(options, selectedPreset, customPresets);
  useEffect(() => {
    if (!bridgeAvailable || previewRows.length === 0) return;
    const missing = previewRows.filter((r) => !thumbnailMap[r.id]).map((r) => r.sourcePath);
    if (missing.length === 0) return;
    setThumbnailMap((prev) => ({ ...prev, ...Object.fromEntries(previewRows.filter((r) => !prev[r.id]).map((r) => [r.id, { loading: true }])) }));
    void window.foxpix.getThumbnails({ sourcePaths: missing }).then((results) => {
      setThumbnailMap((prev) => {
        const next = { ...prev };
        results.forEach((t) => {
          next[t.sourcePath] = { dataUrl: t.dataUrl, loading: false, error: t.error, hasAlpha: t.hasAlpha };
        });
        return next;
      });
    }).catch(() => {});
  }, [bridgeAvailable, previewRows, thumbnailMap]);

  const applyPreset = (preset: WorkflowPresetId): void => { setSelectedPreset(preset); if (!isBuiltInPreset(preset)) return; setOptions((prev) => ({ ...prev, ...workflowPresets[preset] })); setEstimateTotals(null); setStudioPreview(null); setStatus('Preset applied. Preview or Estimate Sizes again.'); };
  const applyCustomPreset = (id: string): void => { const found = customPresets.find((p) => p.id === id); if (!found) return; setSelectedPreset(`custom:${id}` as WorkflowPresetId); setOptions((prev) => ({ ...prev, ...found.settings })); setEstimateTotals(null); setStudioPreview(null); setStatus('Preset applied. Preview or Estimate Sizes again.'); };
  const onOptionsChange = (next: GuiOptions): void => {
    const namingChanged = next.pattern !== options.pattern || next.prefix !== options.prefix || next.custom !== options.custom;
    if ((next.outputFormat ?? 'webp') !== (options.outputFormat ?? 'webp') && previewRows.length > 0) {
      setPreviewRows([]);
      setIncludedMap({});
      setEstimateTotals(null);
      setFormatOverrides({});
      setStudioPreview(null);
      setStatus('Settings changed. Preview or Estimate Sizes again before processing.');
    }
    if (namingChanged && previewRows.length > 0) {
      setStudioPreview(null);
      setEstimateTotals(null);
      setStatus('Filename pattern changed. Click Preview again.');
    }
    setOptions(next); const base = isBuiltInPreset(selectedPreset) ? workflowPresets[selectedPreset] : null; if (base && (next.pattern !== (base.pattern ?? next.pattern) || next.quality !== (base.quality ?? next.quality) || next.alphaQuality !== (base.alphaQuality ?? next.alphaQuality) || next.lossless !== (base.lossless ?? next.lossless) || next.effort !== (base.effort ?? next.effort) || next.keepMetadata !== (base.keepMetadata ?? next.keepMetadata))) setSelectedPreset('custom'); };

  const pickInput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectInputFolder(); if (!picked) return; setRecentInputs((prev) => pushRecentPath(prev, picked)); setOptions((prev) => outputTouched ? { ...prev, input: picked, filePaths: [] } : { ...prev, input: picked, filePaths: [], output: '' }); setStatus('Folder selected. Click Preview to check output names.'); };
  const pickOutput = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectOutputFolder(); if (picked) { setRecentOutputs((prev) => pushRecentPath(prev, picked)); setOptions((prev) => ({ ...prev, output: picked })); setOutputTouched(true); setStatus('Output folder selected.'); } };
  const pickFiles = async (): Promise<void> => { if (!bridgeAvailable) return; const picked = await window.foxpix.selectImageFiles(); if (!picked || picked.length === 0) return; setOptions((prev) => ({ ...prev, filePaths: picked, input: undefined, output: outputTouched ? prev.output : '' })); setStatus(`Selected files: ${picked.length}`); };

  const handlePreview = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); setBusy(true); setStatus('Preparing preview...'); try { const result = await window.foxpix.preview({ ...options, output: options.output || undefined, formatOverrides }); setPreviewRows(result.rows); setThumbnailMap({}); setIncludedMap(Object.fromEntries(result.rows.map((r) => [r.id, true]))); setEstimatesStale(true); setOutputFolderStatus(result.outputFolderStatus ?? null); setOptions((prev) => ({ ...prev, output: result.outputFolder })); setStatus(result.total === 0 ? 'No supported files found in this source.' : `Preview ready (${result.total} files).`); } catch (error) { setStatus(`Preview failed: ${toMessage(error)}`); } finally { setBusy(false); } };
  const handleEstimate = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); const includedPaths = previewRows.filter((r) => includedMap[r.id] !== false).map((r) => r.sourcePath); if (includedPaths.length === 0) return void setStatus('Select at least one image to process.'); setBusy(true); setStatus('Estimating output sizes...'); try { const result = await window.foxpix.estimateSizes({ ...options, output: options.output || undefined, includedPaths, formatOverrides }); setPreviewRows((prev) => prev.map((row) => { const found = result.rows.find((r) => r.id === row.id); return found ?? { ...row, status: includedMap[row.id] === false ? 'skipped' : row.status, estimatedOutputSize: undefined, estimatedSavedPercent: undefined }; })); setEstimateTotals(result.totals); setEstimatesStale(false); setStatus(`Estimated ${result.totals.estimatedCount} files${result.totals.failedCount > 0 ? `, ${result.totals.failedCount} failed` : ''}.`); } catch (error) { setStatus(`Estimate failed: ${toMessage(error)}`); } finally { setBusy(false); } };

  const handleProcess = async (): Promise<void> => { if (bridgeError) return void setStatus(bridgeError); if (validationError) return void setStatus(validationError); const includedPaths = previewRows.filter((r) => includedMap[r.id] !== false).map((r) => r.sourcePath); if (includedPaths.length === 0) return void setStatus('Select at least one image to process.'); setBusy(true); setStatus('Processing batch...'); try { const result = await window.foxpix.process({ ...options, output: options.output || undefined, includedPaths, formatOverrides }); setSummary(result.summary); setManifestPath(result.manifestPath); setManifestCsvPath(result.manifestCsvPath); setOptions((prev) => ({ ...prev, output: result.outputFolder })); setStatus(result.summary.failed > 0 ? `Completed with warnings: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.` : `Completed: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.`); } catch (error) { setStatus(`Processing failed: ${toMessage(error)}`); } finally { setBusy(false); } };

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
      <div className="actions"><button title="Ctrl+Shift+O" type="button" className="secondary" onClick={() => void pickFiles()} disabled={busy || !bridgeAvailable}>Choose Image File(s) <span className="status-chip">Ctrl+Shift+O</span></button></div>
      <div className={`panel dropzone ${dragOver ? 'drag-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => void onDrop(e)}><strong>Drop a folder or multiple image files</strong><p>Drag a folder for folder mode, or drag supported files for selected-files mode.</p></div>
      <SettingsPanel options={options} onChange={onOptionsChange} disabled={busy} selectedPreset={selectedPreset} presetLabel={presetMatch.label} customPresets={customPresets} onPresetChange={applyPreset} onCustomPresetSelect={applyCustomPreset} onSavePreset={(name) => { const result = savePreset(customPresets, name, options); setCustomPresets(result.presets); if (result.saved) setSelectedPreset(`custom:${result.saved.id}` as WorkflowPresetId); setStatus(result.status); }} onRenamePreset={(id, name) => { const result = renamePreset(customPresets, id, name); setCustomPresets(result.presets); setStatus(result.status); }} onDeletePreset={(id) => { setCustomPresets((prev) => deletePreset(prev, id)); if (selectedPreset === (`custom:${id}` as WorkflowPresetId)) setSelectedPreset('custom'); setStatus('Preset deleted.'); }} onExportPresets={async () => { if (customPresets.length === 0) return setStatus('No custom presets to export.'); const res = await window.foxpix.exportPresets(serializePresetPack(customPresets)); setStatus(res.ok ? `Exported ${customPresets.length} custom presets.` : `Export failed: ${res.error}`); }} onImportPresets={async () => { const res = await window.foxpix.importPresets(); if (!res.ok) return setStatus(`Import failed: ${res.error}`); const parsed = parsePresetPack(res.rawJson); if (!parsed.ok) return setStatus(parsed.error); if (parsed.presets.length === 0) return setStatus('No valid presets found.'); const merged = mergeImportedPresets(customPresets, parsed.presets); setCustomPresets(merged); setStatus(`Imported ${parsed.presets.length} presets.`); }} />
      <div className="actions sticky-actions">
        <button title="Ctrl+P" type="button" onClick={() => void handlePreview()} disabled={!availability.preview.enabled} className="secondary">Preview <span className="status-chip">Ctrl+P</span></button>
        <button title="Ctrl+E" type="button" onClick={() => void handleEstimate()} disabled={!availability.estimate.enabled} className="secondary">Estimate Sizes <span className="status-chip">Ctrl+E</span></button>
        <button title="Ctrl+Enter" type="button" onClick={() => void handleProcess()} disabled={!availability.process.enabled} className="primary">Process Included <span className="status-chip">Ctrl+Enter</span></button>
        {!availability.preview.enabled || !availability.estimate.enabled || !availability.process.enabled ? <p className="hint warn">{availability.preview.reason ?? availability.estimate.reason ?? availability.process.reason}</p> : null}
        <button type="button" onClick={() => void (async () => { if (!bridgeAvailable) return void setStatus(bridgeMsg); const result = await window.foxpix.openFolder(outputDisplay); if (!result.ok) setStatus(`Open output folder failed. ${result.error}`); })()} disabled={!bridgeAvailable || !outputDisplay} className="secondary">Open output folder</button>
      </div>
      <section className="panel"><h3>Recents</h3><div className="recents-grid"><div className="recent-col"><h4>Recent source</h4><div className="actions">{recentInputs.map((p) => <button key={p} title={p} type="button" className="secondary path-btn" onClick={() => setOptions((prev) => ({ ...prev, input: p, filePaths: [] }))}>{p}</button>)}</div></div><div className="recent-col"><h4>Recent output</h4><div className="actions">{recentOutputs.map((p) => <button key={p} title={p} type="button" className="secondary path-btn" onClick={() => { setOutputTouched(true); setOptions((prev) => ({ ...prev, output: p })); }}>{p}</button>)}</div></div></div><button type="button" className="secondary" onClick={() => { setRecentInputs(clearRecentPaths()); setRecentOutputs(clearRecentPaths()); setStatus('Cleared recent paths.'); }}>Clear recents</button></section>
      <section className="panel"><button type="button" className="secondary" onClick={() => setShowHelp((v) => !v)}>{showHelp ? 'Hide Help' : 'Show Help'}</button>{showHelp ? <div><h3>Workflow</h3><p className="hint">Preview writes no files. Estimate Sizes writes no files. Generate Preview writes no files. Process Included writes optimized files plus Manifest JSON and Manifest CSV.</p><h3>Tokens</h3><p className="hint">{'{name}'} {'{prefix}'} {'{index}'} {'{folder}'} {'{custom}'}</p><h3>Formats</h3><p className="hint">WebP recommended. AVIF smaller/slower. JPEG photos only (no transparency). PNG lossless and transparency-safe.</p><h3>Safety</h3><p className="hint">Everything runs locally on your machine.</p></div> : null}</section>
    </section>
    <section className="right">
      <ProgressPanel busy={busy} label={bridgeError ?? validationError ?? status} />
      <section className="panel"><h2>Readiness</h2><p className="hint">{previewRows.length === 0 ? 'Needs preview' : estimatesStale ? 'Needs estimate' : 'Ready'}</p><p className="hint">Source: {mode === 'folder' ? (options.input || 'No source selected') : mode === 'files' ? `${options.filePaths?.length ?? 0} selected files` : 'No source selected'}</p><p className="hint">Global format: {(options.outputFormat ?? 'webp').toUpperCase()} • Mix: {(() => { const mix = computeFormatMix(previewRows); return `WebP ${mix.webp}, AVIF ${mix.avif}, JPEG ${mix.jpeg}, PNG ${mix.png}`; })()}</p><p className="hint">{outputFolderStatus?.status === 'exists' ? 'Output folder exists.' : outputFolderStatus?.status === 'will-create' ? 'Output folder will be created during processing.' : outputFolderStatus?.status === 'not-directory' ? 'Output path is not a folder.' : outputFolderStatus?.status === 'not-accessible' ? 'Output folder cannot be accessed.' : ''}</p>{estimatesStale ? <p className="hint warn">Settings changed. Preview or Estimate Sizes again before processing.</p> : null}</section>
      <section className="panel"><h2>Smart Recommendations</h2>{undoSnapshot ? <button type="button" className="secondary" onClick={() => { const u = undoRecommendationAction(undoSnapshot); if (u.nextOptions) setOptions((prev) => ({ ...prev, ...u.nextOptions })); if (u.nextIncludedMap) setIncludedMap(u.nextIncludedMap); if (u.nextFormatOverrides) setFormatOverrides(u.nextFormatOverrides as any); if (u.nextFilter) setActiveReviewFilter(u.nextFilter); setUndoSnapshot(null); setStatus(u.status); }}>Undo last action</button> : null}<ul>{buildRecommendations({ rows: previewRows, includedMap, outputFormat: normalizeOutputFormat(options.outputFormat), estimatesReady: estimateTotals !== null, estimatesStale, outputFolderStatus, patternWarnings: getPatternWarnings({ pattern: options.pattern, prefix: options.prefix, custom: options.custom }) }).map((n) => <li key={n.text} className="hint">{n.text} {n.action ? <button type="button" className="secondary" onClick={() => { const result = executeRecommendationAction({ action: n.action!, rows: previewRows, includedMap, formatOverrides: formatOverrides as any, options, activeFilter: activeReviewFilter }); if (result.nextOptions) setOptions((prev) => ({ ...prev, ...result.nextOptions })); if (result.nextIncludedMap) setIncludedMap(result.nextIncludedMap); if (result.nextFormatOverrides) setFormatOverrides(result.nextFormatOverrides as any); if (result.nextFilter) setActiveReviewFilter(result.nextFilter); if (result.clearEstimates) setEstimateTotals(null); if (result.clearStudioPreview) setStudioPreview(null); if (result.shouldRunEstimate) void handleEstimate(); setUndoSnapshot(result.undoSnapshot ?? null); setStatus(result.status); }}>{n.action.label}</button> : null}</li>)}</ul></section>
      <section className="panel"><p className="hint">Only included rows will be estimated and processed.</p><p className="hint">{(() => { const c = computeReviewCounts(previewRows, includedMap, formatOverrides); return `Ready to process: ${c.included} of ${c.total} images • Skipped: ${c.skipped} • Overrides: ${c.overrides} • Renamed: ${c.renamed} • Warnings: ${c.warnings} • Errors: ${c.errors}`; })()}</p>{previewRows.some((r) => r.wasRenamedForCollision || r.outputAlreadyExists) ? <p className="hint warn">Some output names were adjusted to avoid collisions.</p> : null}</section>
      <PreviewTable rows={previewRows} includedMap={includedMap} thumbnailMap={thumbnailMap} activeFilter={activeReviewFilter} onFilterChange={setActiveReviewFilter} onToggleInclude={(id, included) => setIncludedMap((prev) => ({ ...prev, [id]: included }))} onSelectAll={() => setIncludedMap(Object.fromEntries(previewRows.map((r) => [r.id, true])))} onDeselectAll={() => setIncludedMap(Object.fromEntries(previewRows.map((r) => [r.id, false])))} onInvertSelection={() => setIncludedMap(Object.fromEntries(previewRows.map((r) => [r.id, !(includedMap[r.id] !== false)])))} selectedRowKey={selectedRowKey} onSelectRow={(key) => { setSelectedRowKey(key); setStudioPreview(null); }} globalFormat={normalizeOutputFormat(options.outputFormat)} formatOverrides={formatOverrides} onSetFormatOverride={(id, format) => { setFormatOverrides((prev) => { const next = { ...prev }; if (!format) delete next[id]; else next[id] = format; return next; }); setStudioPreview(null); setEstimateTotals(null); setStatus('Format overrides changed. Click Preview or Estimate Sizes again.'); }} onResetAllOverrides={() => { setFormatOverrides(resetAllOverrides()); setStudioPreview(null); setEstimateTotals(null); setStatus('Format overrides changed. Click Preview or Estimate Sizes again.'); }} onBulkSetIncludedFormat={(format) => { setFormatOverrides((prev) => applyBulkIncludedOverrides(previewRows, includedMap, prev, format)); setStudioPreview(null); setEstimateTotals(null); setStatus('Format overrides changed. Click Preview or Estimate Sizes again.'); }} onVisibleRowIdsChange={setVisibleRowIds} />

      <section className="panel">
        <h2>Preview Studio</h2>
        {!selectedRowKey ? <p className="hint">Select an image from the preview table to inspect it.</p> : (() => {
          const row = previewRows.find((r) => r.id === selectedRowKey);
          if (!row) return <p className="hint">Selected row is not visible in the current filter.</p>;
          return <div>
            {!visibleRowIds.includes(row.id) ? <p className="hint warn">Selected row is hidden by the current filter.</p> : null}
            <p className="mono">{row.originalFilename} → {row.outputFilename}</p>
            <p className="hint">Source: {row.sourceFormat.toUpperCase()} • Target: {row.targetFormat.toUpperCase()}</p>{includedMap[row.id] === false ? <p className="hint warn">This row is currently skipped.</p> : null}
            <p className="hint">{row.estimatedOutputSize ? `Estimated output: ${(row.estimatedOutputSize/1024).toFixed(1)} KB` : 'Not estimated yet'}</p>
            <div className="actions">
              <button type="button" className="secondary" disabled={busy} onClick={() => void (async () => {
                setBusy(true); setStatus('Generating image preview...');
                try {
                  const result = await window.foxpix.generateImagePreview({ sourcePath: row.sourcePath, outputFilename: row.outputFilename, outputFormatOverride: getEffectiveOutputFormat(row.id, normalizeOutputFormat(options.outputFormat), formatOverrides), options: { ...options, output: options.output || undefined } });
                  setStudioPreview(result);
                  setStatus(result.error ? `Preview failed: ${result.error}` : 'Preview generated.');
                } catch (error) { setStatus(`Preview failed: ${toMessage(error)}`); } finally { setBusy(false); }
              })()}>Generate Preview</button>
              <button title="Esc" type="button" className="secondary" onClick={() => setStudioPreview(null)} disabled={!studioPreview}>Clear Preview <span className="status-chip">Esc</span></button>
            </div>
            {studioPreview?.error ? <p className="hint warn">{studioPreview.error}</p> : null}
            <div className="preview-studio-grid">
              <div className="image-card"><h3>Original</h3><div className="image-stage">{studioPreview?.original?.dataUrl ? <img className="studio-img" src={studioPreview.original.dataUrl} alt="Original preview" /> : <p className="hint">Generate Preview to view original.</p>}</div></div>
              <div className="image-card"><h3>Optimized Preview</h3><div className="image-stage">{studioPreview?.optimized?.dataUrl ? <img className="studio-img" src={studioPreview.optimized.dataUrl} alt="Optimized preview" /> : <p className="hint">Generate Preview to view optimized.</p>}</div></div>
            </div>
          </div>;
        })()}
      </section>

      <SummaryPanel summary={summary} estimateTotals={estimateTotals} manifestPath={manifestPath} manifestCsvPath={manifestCsvPath} outputFolder={outputDisplay} onOpenPath={async (p) => { const r = await window.foxpix.openFolder(p); if (!r.ok) throw new Error(r.error); }} onFeedback={(m) => setStatus(m)} />
      <section className="panel"><p className="hint">FoxPix • Local-only • Images are processed on this computer and are not uploaded.</p></section>
    </section>
  </main>);
}
