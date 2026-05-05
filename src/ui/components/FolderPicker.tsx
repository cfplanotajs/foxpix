interface FolderPickerProps {
  input: string;
  output: string;
  onInputPick: () => void;
  onOutputPick: () => void;
}

export default function FolderPicker({ input, output, onInputPick, onOutputPick }: FolderPickerProps): JSX.Element {
  return (
    <section className="panel">
      <h2>Folders</h2>
      <div className="field">
        <label>Input folder</label>
        <div className="row">
          <input value={input} readOnly placeholder="Select input folder" />
          <button type="button" onClick={onInputPick}>Browse</button>
        </div>
      </div>
      <div className="field">
        <label>Output folder</label>
        <div className="row">
          <input value={output} readOnly placeholder="Defaults to <input>/optimized" />
          <button type="button" onClick={onOutputPick}>Browse</button>
        </div>
      </div>
    </section>
  );
}
