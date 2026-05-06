import type { PreviewRow } from '../types.js';

export default function PreviewTable({ rows }: { rows: PreviewRow[] }): JSX.Element {
  return (
    <section className="panel">
      <h2>Preview</h2>
      <table>
        <thead><tr><th>Original</th><th>Output</th><th>Size (bytes)</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.originalFilename}-${row.outputFilename}`}>
              <td>{row.originalFilename}</td><td>{row.outputFilename}</td><td>{row.originalSize}</td><td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
