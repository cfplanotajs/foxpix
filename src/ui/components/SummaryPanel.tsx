import type { ProcessingSummary } from '../../types/index.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function SummaryPanel({ summary, manifestPath, manifestCsvPath, outputFolder, onOpenPath }: { summary: ProcessingSummary | null; manifestPath: string; manifestCsvPath: string; outputFolder: string; onOpenPath: (path: string) => Promise<void> }): JSX.Element {
  if (!summary) return <section className="panel"><h2>Summary</h2><p>No run yet.</p></section>;
  const copySummary = async (): Promise<void> => { await navigator.clipboard.writeText(JSON.stringify(summary, null, 2)); };
  const copyOutputs = async (): Promise<void> => { await navigator.clipboard.writeText(summary.files.map((f) => f.outputFilename).join('\n')); };
  return (
    <section className="panel">
      <h2>Summary</h2>
      <div className="metric-grid">
        <div className="metric"><span>Discovered</span><strong>{summary.discovered}</strong></div>
        <div className="metric"><span>Succeeded</span><strong>{summary.succeeded}</strong></div>
        <div className={`metric ${summary.failed > 0 ? 'warn' : ''}`}><span>Failed</span><strong>{summary.failed}</strong></div>
        <div className="metric"><span>Original size</span><strong>{formatBytes(summary.originalBytes)}</strong></div>
        <div className="metric"><span>Optimized size</span><strong>{formatBytes(summary.outputBytes)}</strong></div>
        <div className="metric"><span>Saved</span><strong>{formatBytes(summary.savedBytes)}</strong></div>
        <div className="metric"><span>Saved %</span><strong>{summary.savedPercent}%</strong></div>
      </div>
      <p className="mono">Output folder: {outputFolder}</p>
      <p className="mono">Manifest: {manifestPath}</p>
      <p className="mono">CSV manifest: {manifestCsvPath}</p>
      <div className="actions"><button type="button" onClick={() => void onOpenPath(outputFolder)}>Open output folder</button><button type="button" onClick={() => void onOpenPath(manifestPath)}>Open manifest file</button><button type="button" onClick={() => void copySummary()}>Copy summary</button><button type="button" onClick={() => void copyOutputs()}>Copy output filenames</button></div>
    </section>
  );
}
