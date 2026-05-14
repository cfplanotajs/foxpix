import { useEffect, useMemo, useState } from 'react';
import type { PreviewRow } from '../types.js';
import type { OutputFormat } from '../../types/index.js';
import { classifyEstimateRow, filterPreviewRows, getRowWarningState, type ReviewFilter } from '../reviewState.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function PreviewTable({ rows, includedMap, thumbnailMap, onToggleInclude, onSelectAll, onDeselectAll, onInvertSelection, selectedRowKey, onSelectRow, globalFormat, formatOverrides, onSetFormatOverride, onResetAllOverrides, onBulkSetIncludedFormat, onVisibleRowIdsChange, activeFilter, onFilterChange }: { rows: PreviewRow[]; includedMap: Record<string, boolean>; thumbnailMap: Record<string, { dataUrl?: string; loading?: boolean; error?: string; hasAlpha?: boolean }>; onToggleInclude: (id: string, included: boolean) => void; onSelectAll: () => void; onDeselectAll: () => void; onInvertSelection: () => void; selectedRowKey?: string | null; onSelectRow?: (key: string) => void; globalFormat: OutputFormat; formatOverrides: Record<string, OutputFormat>; onSetFormatOverride: (id: string, format?: OutputFormat) => void; onResetAllOverrides: () => void; onBulkSetIncludedFormat: (format: OutputFormat) => void; onVisibleRowIdsChange?: (ids: string[]) => void; activeFilter?: ReviewFilter; onFilterChange?: (f: ReviewFilter) => void }): JSX.Element {
  const [query, setQuery] = useState('');
  const [internalFilter, setInternalFilter] = useState<ReviewFilter>('all');
  const filter = activeFilter ?? internalFilter;
  const filtered = useMemo(() => {
    return filterPreviewRows(rows, filter, query, includedMap, formatOverrides);
  }, [rows, filter, query, includedMap, formatOverrides]);
  useEffect(() => { onVisibleRowIdsChange?.(filtered.map((row) => row.id)); }, [filtered, onVisibleRowIdsChange]);

  return (
    <section className="panel">
      <div className="preview-head"><h2>Preview</h2><span className="pill">Total: {rows.length}</span></div>
      <div className="preview-toolbar">
        <div className="toolbar-group"><p className="toolbar-title">Selection actions</p>
        <div className="actions"><button type="button" className="secondary" onClick={onSelectAll}>Select all</button><button type="button" className="secondary" onClick={onDeselectAll}>Deselect all</button><button type="button" className="secondary" onClick={onInvertSelection}>Invert selection</button><button type="button" className="secondary" onClick={onResetAllOverrides}>Reset Overrides</button></div>
        </div>
        <div className="toolbar-group"><p className="toolbar-title">Bulk format actions</p><div className="actions"><button type="button" className="secondary" onClick={() => onBulkSetIncludedFormat('webp')}>Included → WebP</button><button type="button" className="secondary" onClick={() => onBulkSetIncludedFormat('avif')}>Included → AVIF</button><button type="button" className="secondary" onClick={() => onBulkSetIncludedFormat('jpeg')}>Included → JPEG</button><button type="button" className="secondary" onClick={() => onBulkSetIncludedFormat('png')}>Included → PNG</button></div></div>
        <div className="toolbar-group"><p className="toolbar-title">Search + filters</p><div className="actions"><button type="button" className="secondary" onClick={() => { onFilterChange?.('all'); setInternalFilter('all'); }}>All</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('included'); setInternalFilter('included'); }}>Included</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('skipped'); setInternalFilter('skipped'); }}>Skipped</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('overrides'); setInternalFilter('overrides'); }}>Override</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('renamed'); setInternalFilter('renamed'); }}>Renamed</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('warnings'); setInternalFilter('warnings'); }}>Warnings</button><button type="button" className="secondary" onClick={() => { onFilterChange?.('errors'); setInternalFilter('errors'); }}>Errors</button></div><label>Search<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by original or output filename" /></label></div>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state"><p><strong>No files previewed yet.</strong></p><p>Drop a folder or choose image files, then click Preview.</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p><strong>No matching files.</strong></p><p>Try a different search term.</p></div>
      ) : (
        <div className="table-wrap"><table>
          <thead><tr><th>Include</th><th>Thumb</th><th>Original</th><th>Output</th><th>Current format</th><th>Target format</th><th>Current size</th><th>Expected size</th><th>Savings</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className={`${selectedRowKey === row.id ? 'selected-row' : ''} ${includedMap[row.id] === false ? 'row-skipped' : ''} ${getRowWarningState(row).warning ? 'row-warn' : ''} ${getRowWarningState(row).error ? 'row-error' : ''}`} onClick={() => onSelectRow?.(row.id)}>
                <td><input type="checkbox" checked={includedMap[row.id] !== false} onChange={(e) => onToggleInclude(row.id, e.target.checked)} onClick={(e) => e.stopPropagation()} /></td><td>{thumbnailMap[row.id]?.dataUrl ? <div className="thumb-box"><img className="thumb-img" src={thumbnailMap[row.id].dataUrl} alt="thumb" /></div> : thumbnailMap[row.id]?.loading ? <span className="pill">loading</span> : <span className="pill">{row.sourceFormat.toUpperCase()}</span>}{thumbnailMap[row.id]?.hasAlpha ? <span className="pill">alpha</span> : null}</td><td className="mono" title={row.originalFilename}>{row.originalFilename}</td>
                <td className="file-emphasis" title={row.outputFilename}>{row.outputFilename}{row.wasRenamedForCollision ? <div className="hint">wanted: {row.desiredOutputFilename}</div> : null}</td>
                <td><span className="pill">{row.sourceFormat.toUpperCase()}</span></td><td><select value={formatOverrides[row.id] ?? ''} onChange={(e) => onSetFormatOverride(row.id, (e.target.value || undefined) as OutputFormat | undefined)} onClick={(e) => e.stopPropagation()}><option value="">Follow global ({globalFormat.toUpperCase()})</option><option value="webp">WebP</option><option value="avif">AVIF</option><option value="jpeg">JPEG</option><option value="png">PNG</option></select>{formatOverrides[row.id] ? <span className="pill">Override</span> : null}<div className="pill">{row.targetFormat.toUpperCase() === 'JPEG' ? 'JPG' : row.targetFormat.toUpperCase()}</div></td><td>{formatBytes(row.originalSize)}</td><td>{row.estimatedOutputSize ? formatBytes(row.estimatedOutputSize) : '—'}</td><td>{typeof row.estimatedSavedPercent === 'number' ? `${row.estimatedSavedPercent}%` : '—'}</td>
                <td>{(() => { const state = classifyEstimateRow(row, includedMap[row.id] !== false); return <><span className={`pill status-${includedMap[row.id] === false ? 'skipped' : row.status}`}>{includedMap[row.id] === false ? 'skipped' : 'included'}</span><span className="pill">{state === 'not_estimated' ? 'not estimated' : state}</span>{row.wasRenamedForCollision ? <span className="pill">Renamed</span> : null}{row.collisionReason === 'existing-output-file' || row.collisionReason === 'both' ? <span className="pill">Existing file</span> : null}{row.collisionReason === 'batch-duplicate' || row.collisionReason === 'both' ? <span className="pill">Duplicate name</span> : null}{row.collisionSuffix ? <span className="pill">Safe suffix</span> : null}{state === 'larger' ? <span className="pill">larger</span> : null}{getRowWarningState(row).warning ? <span className="pill">warning</span> : null}{getRowWarningState(row).error ? <span className="pill">error</span> : null}{row.error ? <div className="hint">{row.error}</div> : null}</>; })()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
