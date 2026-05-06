import type { ProcessingSummary } from '../../types/index.js';

export default function SummaryPanel({ summary, manifestPath, manifestCsvPath, outputFolder, onOpenPath }: { summary: ProcessingSummary | null; manifestPath: string; manifestCsvPath: string; outputFolder: string; onOpenPath: (path: string) => Promise<void> }): JSX.Element {
  if (!summary) return <section className="panel"><h2>Summary</h2><p>No run yet.</p></section>;
  const copySummary = async (): Promise<void> => { await navigator.clipboard.writeText(JSON.stringify(summary, null, 2)); };
  const copyOutputs = async (): Promise<void> => { await navigator.clipboard.writeText(summary.files.map((f) => f.outputFilename).join('\n')); };
  return (
    <section className="panel">
      <h2>Summary</h2>
      <ul>
        <li>Discovered: {summary.discovered}</li><li>Processed: {summary.processed}</li><li>Succeeded: {summary.succeeded}</li><li>Failed: {summary.failed}</li>
        <li>Total input bytes: {summary.originalBytes}</li><li>Optimized input bytes: {summary.succeededOriginalBytes}</li><li>Failed input bytes: {summary.failedOriginalBytes}</li>
        <li>Output bytes: {summary.outputBytes}</li><li>Saved bytes: {summary.savedBytes}</li><li>Saved percent: {summary.savedPercent}%</li>
        <li>Output folder: {outputFolder}</li><li>Manifest: {manifestPath}</li><li>CSV manifest: {manifestCsvPath}</li>
      </ul>
      <div className="actions"><button type="button" onClick={() => void onOpenPath(outputFolder)}>Open output folder</button><button type="button" onClick={() => void onOpenPath(manifestPath)}>Open manifest file</button><button type="button" onClick={() => void copySummary()}>Copy summary</button><button type="button" onClick={() => void copyOutputs()}>Copy output filenames</button></div>
    </section>
  );
}
