import type { ProcessingSummary } from '../../types/index.js';

export default function SummaryPanel({ summary, manifestPath }: { summary: ProcessingSummary | null; manifestPath: string }): JSX.Element {
  if (!summary) return <section className="panel"><h2>Summary</h2><p>No run yet.</p></section>;
  return (
    <section className="panel">
      <h2>Summary</h2>
      <ul>
        <li>Discovered: {summary.discovered}</li>
        <li>Processed: {summary.processed}</li>
        <li>Succeeded: {summary.succeeded}</li>
        <li>Failed: {summary.failed}</li>
        <li>Original bytes: {summary.originalBytes}</li>
        <li>Output bytes: {summary.outputBytes}</li>
        <li>Saved bytes: {summary.savedBytes}</li>
        <li>Saved percent: {summary.savedPercent}%</li>
      </ul>
      <p>Manifest: {manifestPath}</p>
      {summary.failed > 0 && (
        <div>
          <h3>Failed files</h3>
          <ul>{summary.files.filter((f) => f.status === 'failed').map((f) => <li key={f.originalPath}>{f.originalFilename}: {f.error}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
