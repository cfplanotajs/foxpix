interface FolderPickerProps {
  input: string;
  output: string;
  mode: 'folder' | 'files' | 'none';
  selectedFileCount: number;
  onInputPick: () => void;
  onOutputPick: () => void;
  disabled?: boolean;
}

export default function FolderPicker({ input, output, mode, selectedFileCount, onInputPick, onOutputPick, disabled = false }: FolderPickerProps): JSX.Element {
  const sourceLabel = mode === 'files'
    ? `Selected files: ${selectedFileCount}`
    : mode === 'folder'
      ? `Folder source: ${input || 'Not selected yet'}`
      : 'Drop a folder or choose image files to begin.';

  return (
    <section className="panel">
      <h2>Source</h2>
      <p className="mode-indicator">Mode: {mode === 'files' ? 'Selected files mode' : mode === 'folder' ? 'Folder mode' : 'Not selected'}</p>
      <p className="hint">{sourceLabel}</p>
      <div className="field">
        <label>Input folder</label>
        <div className="row">
          <input value={input} readOnly placeholder="Select input folder" />
          <button title="Ctrl+O" type="button" onClick={onInputPick} disabled={disabled}>Choose Folder <span className="status-chip">Ctrl+O</span></button>
        </div>
      </div>
      <div className="field">
        <label>Output folder</label>
        <div className="row">
          <input value={output} readOnly placeholder="Defaults to <input>/optimized" />
          <button type="button" onClick={onOutputPick} disabled={disabled}>Choose Output</button>
        </div>
      </div>
    </section>
  );
}
