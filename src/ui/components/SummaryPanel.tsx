import type { ProcessingSummary } from '../../types/index.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function SummaryPanel({ summary, estimateTotals, manifestPath, manifestCsvPath, outputFolder, onOpenPath, onFeedback }: { summary: ProcessingSummary | null; estimateTotals: { totalOriginalBytes: number; totalEstimatedOutputBytes: number; totalEstimatedSavedBytes: number; totalEstimatedSavedPercent: number; estimatedCount: number; failedCount: number } | null; manifestPath: string; manifestCsvPath: string; outputFolder: string; onOpenPath: (path: string) => Promise<void>; onFeedback: (message: string) => void }): JSX.Element {
  if (!summary && !estimateTotals) return <section className="panel"><h2>Summary</h2><p className="hint">No run yet.</p></section>;
  const copySummary = async (): Promise<void> => {
    if (!summary) return;
    const text = `FoxPix Optimization Summary\nProcessed: ${summary.files.length}\nSucceeded: ${summary.succeeded}\nFailed: ${summary.failed}\nOriginal size: ${formatBytes(summary.originalBytes)}\nOutput size: ${formatBytes(summary.outputBytes)}\nSaved: ${formatBytes(summary.savedBytes)} (${summary.savedPercent}%)\nOutput folder: ${outputFolder}\nManifest JSON: ${manifestPath}\nManifest CSV: ${manifestCsvPath}`;
    await navigator.clipboard.writeText(text); onFeedback('Copied summary.');
  };
  const copyOutputs = async (): Promise<void> => { if (!summary) return; await navigator.clipboard.writeText(summary.files.map((f) => f.outputFilename).join('\n')); onFeedback('Copied output filenames.'); };
  return (
    <section className="panel">
      <h2>Summary</h2>{estimateTotals ? <section className="summary-block"><h3>Estimated results</h3><div className="metric-grid"><div className="metric"><span>Estimated rows</span><strong>{estimateTotals.estimatedCount}</strong></div><div className="metric"><span>Failed estimates</span><strong>{estimateTotals.failedCount}</strong></div><div className="metric"><span>Estimated output</span><strong>{formatBytes(estimateTotals.totalEstimatedOutputBytes)}</strong></div><div className="metric"><span>Estimated saved</span><strong>{formatBytes(estimateTotals.totalEstimatedSavedBytes)} ({estimateTotals.totalEstimatedSavedPercent}%)</strong></div></div><p className="hint">Estimates are previews. Actual results are calculated after processing.</p></section> : null}{summary ? <h3 className="summary-headline">{summary.failed > 0 ? 'Completed with warnings. Review failed rows.' : 'Success. Processed assets are ready.'}</h3> : null}
      {summary ? <section className="summary-block"><div className="metric-grid">
        <div className="metric"><span>Discovered</span><strong>{summary.discovered}</strong></div>
        <div className="metric"><span>Processed</span><strong>{summary.files.length}</strong></div>
        <div className="metric"><span>Succeeded</span><strong>{summary.succeeded}</strong></div>
        <div className={`metric ${summary.failed > 0 ? 'warn' : ''}`}><span>Failed</span><strong>{summary.failed}</strong></div>
        <div className="metric"><span>Original size</span><strong>{formatBytes(summary.originalBytes)}</strong></div>
        <div className="metric"><span>Output size</span><strong>{formatBytes(summary.outputBytes)}</strong></div>
        <div className="metric"><span>Saved</span><strong>{formatBytes(summary.savedBytes)}</strong></div>
        <div className="metric"><span>Saved %</span><strong>{summary.savedPercent}%</strong></div>
      </div></section> : null}
      <p className="mono">Output folder: {outputFolder}</p>
      <p className="mono">Manifest JSON: {manifestPath}</p>
      <p className="mono">Manifest CSV: {manifestCsvPath}</p>
      <div className="actions action-group">
        <button type="button" onClick={() => void onOpenPath(outputFolder).then(() => onFeedback('Opened output folder.')).catch((e) => onFeedback(`Open folder failed: ${e instanceof Error ? e.message : String(e)}`))}>Open output folder</button>
        <button type="button" onClick={() => { if (!manifestPath) return onFeedback('Manifest not available yet.'); void onOpenPath(manifestPath).then(() => onFeedback('Opened manifest.json.')).catch((e) => onFeedback(`Open manifest failed: ${e instanceof Error ? e.message : String(e)}`)); }}>Open Manifest JSON</button>
        <button type="button" onClick={() => { if (!manifestCsvPath) return onFeedback('Manifest not available yet.'); void onOpenPath(manifestCsvPath).then(() => onFeedback('Opened manifest.csv.')).catch((e) => onFeedback(`Open manifest failed: ${e instanceof Error ? e.message : String(e)}`)); }}>Open Manifest CSV</button>
        <button type="button" onClick={() => void copySummary()} disabled={!summary}>Copy summary</button>
        <button type="button" onClick={() => void copyOutputs()} disabled={!summary}>Copy output filenames</button>
      </div>
    </section>
  );
}
