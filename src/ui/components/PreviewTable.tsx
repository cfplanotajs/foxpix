import { useMemo, useState } from 'react';
import type { PreviewRow } from '../types.js';
import type { OutputFormat } from '../../types/index.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function PreviewTable({ rows, includedMap, onToggleInclude, onSelectAll, onDeselectAll, onInvertSelection, selectedRowKey, onSelectRow, globalFormat, formatOverrides, onSetFormatOverride, onResetAllOverrides }: { rows: PreviewRow[]; includedMap: Record<string, boolean>; onToggleInclude: (id: string, included: boolean) => void; onSelectAll: () => void; onDeselectAll: () => void; onInvertSelection: () => void; selectedRowKey?: string | null; onSelectRow?: (key: string) => void; globalFormat: OutputFormat; formatOverrides: Record<string, OutputFormat>; onSetFormatOverride: (id: string, format?: OutputFormat) => void; onResetAllOverrides: () => void }): JSX.Element {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.originalFilename.toLowerCase().includes(q) || row.outputFilename.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <section className="panel">
      <div className="preview-head"><h2>Preview</h2><span className="pill">Total: {rows.length}</span></div>
      <div className="actions"><button type="button" className="secondary" onClick={onSelectAll}>Select all</button><button type="button" className="secondary" onClick={onDeselectAll}>Deselect all</button><button type="button" className="secondary" onClick={onInvertSelection}>Invert selection</button><button type="button" className="secondary" onClick={onResetAllOverrides}>Reset format overrides</button></div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search original or output filename" />
      {rows.length === 0 ? (
        <div className="empty-state"><p><strong>No files previewed yet.</strong></p><p>Drop a folder or choose image files, then click Preview.</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p><strong>No matching files.</strong></p><p>Try a different search term.</p></div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Include</th><th>Original</th><th>Output</th><th>Current format</th><th>Target format</th><th>Current size</th><th>Expected size</th><th>Savings</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.originalFilename}-${row.outputFilename}`} className={selectedRowKey === `${row.originalFilename}-${row.outputFilename}` ? 'selected-row' : ''} onClick={() => onSelectRow?.(`${row.originalFilename}-${row.outputFilename}`)}>
                <td><input type="checkbox" checked={includedMap[row.id] !== false} onChange={(e) => onToggleInclude(row.id, e.target.checked)} onClick={(e) => e.stopPropagation()} /></td><td className="mono" title={row.originalFilename}>{row.originalFilename}</td>
                <td className="file-emphasis" title={row.outputFilename}>{row.outputFilename}</td>
                <td><span className="pill">{row.sourceFormat.toUpperCase()}</span></td><td><select value={formatOverrides[row.id] ?? ''} onChange={(e) => onSetFormatOverride(row.id, (e.target.value || undefined) as OutputFormat | undefined)} onClick={(e) => e.stopPropagation()}><option value="">Follow global ({globalFormat.toUpperCase()})</option><option value="webp">WebP</option><option value="avif">AVIF</option><option value="jpeg">JPEG</option><option value="png">PNG</option></select>{formatOverrides[row.id] ? <span className="pill">Override</span> : null}<div className="pill">{row.targetFormat.toUpperCase() === 'JPEG' ? 'JPG' : row.targetFormat.toUpperCase()}</div></td><td>{formatBytes(row.originalSize)}</td><td>{row.estimatedOutputSize ? formatBytes(row.estimatedOutputSize) : '—'}</td><td>{typeof row.estimatedSavedPercent === 'number' ? `${row.estimatedSavedPercent}%` : '—'}</td>
                <td><span className={`pill status-${includedMap[row.id] === false ? 'skipped' : row.status}`}>{row.error ? 'failed' : row.status}</span>{row.error ? <div className="hint">{row.error}</div> : null}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
