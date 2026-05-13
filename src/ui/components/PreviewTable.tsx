import { useMemo, useState } from 'react';
import type { PreviewRow } from '../types.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function PreviewTable({ rows }: { rows: PreviewRow[] }): JSX.Element {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.originalFilename.toLowerCase().includes(q) || row.outputFilename.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <section className="panel">
      <div className="preview-head"><h2>Preview</h2><span className="pill">Total: {rows.length}</span></div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search original or output filename" />
      {rows.length === 0 ? (
        <div className="empty-state"><p><strong>No files previewed yet.</strong></p><p>Drop a folder or choose image files, then click Preview.</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p><strong>No matching files.</strong></p><p>Try a different search term.</p></div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Original</th><th>Output</th><th>Source size</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.originalFilename}-${row.outputFilename}`}>
                <td className="mono" title={row.originalFilename}>{row.originalFilename}</td>
                <td className="file-emphasis" title={row.outputFilename}>{row.outputFilename}</td>
                <td>{formatBytes(row.originalSize)}</td>
                <td><span className={`pill status-${row.status}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
