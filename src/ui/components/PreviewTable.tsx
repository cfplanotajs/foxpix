import type { PreviewRow } from '../types.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function PreviewTable({ rows }: { rows: PreviewRow[] }): JSX.Element {
  return (
    <section className="panel">
      <h2>Preview</h2>
      {rows.length === 0 ? (
        <div className="empty-state"><p><strong>No files previewed yet.</strong></p><p>Choose or drop a folder, then click Preview.</p></div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Original</th><th>Output</th><th>Size</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.originalFilename}-${row.outputFilename}`}>
                <td className="mono" title={row.originalFilename}>{row.originalFilename}</td>
                <td className="file-emphasis" title={row.outputFilename}>{row.outputFilename}</td>
                <td>{formatBytes(row.originalSize)}</td>
                <td><span className="pill">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
