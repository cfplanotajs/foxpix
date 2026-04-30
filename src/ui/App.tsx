import { useMemo, useState } from 'react';
import FolderPicker from './components/FolderPicker.js';
import SettingsPanel from './components/SettingsPanel.js';
import PreviewTable from './components/PreviewTable.js';
import SummaryPanel from './components/SummaryPanel.js';
import ProgressPanel from './components/ProgressPanel.js';
import type { PreviewRow, GuiOptions } from './types.js';
import type { ProcessingSummary } from '../types/index.js';

const defaults: GuiOptions = {
  input: '',
  output: '',
  prefix: '',
  pattern: '{prefix}-{index}',
  custom: '',
  quality: 85,
  alphaQuality: 100,
  lossless: false,
  recursive: false,
  keepMetadata: false
};

export default function App(): JSX.Element {
  const [options, setOptions] = useState<GuiOptions>(defaults);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ProcessingSummary | null>(null);
  const [manifestPath, setManifestPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Idle');

  const outputDisplay = useMemo(() => {
    if (options.output) return options.output;
    if (!options.input) return '';
    return `${options.input}/optimized`;
  }, [options.input, options.output]);

  const pickInput = async (): Promise<void> => {
    const picked = await window.foxpix.selectInputFolder();
    if (picked) {
      setOptions((prev) => ({ ...prev, input: picked, output: prev.output || `${picked}/optimized` }));
    }
  };

  const pickOutput = async (): Promise<void> => {
    const picked = await window.foxpix.selectOutputFolder();
    if (picked) {
      setOptions((prev) => ({ ...prev, output: picked }));
    }
  };

  const handlePreview = async (): Promise<void> => {
    setBusy(true);
    setStatus('Preparing preview...');
    const result = await window.foxpix.preview({ ...options, output: options.output || undefined });
    setPreviewRows(result.rows);
    setStatus(`Preview ready (${result.total} files).`);
    setBusy(false);
  };

  const handleProcess = async (): Promise<void> => {
    setBusy(true);
    setStatus('Processing batch...');
    const result = await window.foxpix.process({ ...options, output: options.output || undefined });
    setSummary(result.summary);
    setManifestPath(result.manifestPath);
    setStatus(`Completed: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.`);
    setBusy(false);
  };

  return (
    <main className="app">
      <section className="left">
        <h1>FoxPix GUI MVP</h1>
        <FolderPicker input={options.input} output={outputDisplay} onInputPick={pickInput} onOutputPick={pickOutput} />
        <SettingsPanel options={options} onChange={setOptions} disabled={busy} />
        <div className="actions">
          <button type="button" onClick={() => void handlePreview()} disabled={busy || !options.input}>Preview (dry run)</button>
          <button type="button" onClick={() => void handleProcess()} disabled={busy || !options.input}>Process</button>
          <button type="button" onClick={() => void window.foxpix.openFolder(outputDisplay)} disabled={!outputDisplay}>Open output folder</button>
        </div>
      </section>
      <section className="right">
        <ProgressPanel busy={busy} label={status} />
        <PreviewTable rows={previewRows} />
        <SummaryPanel summary={summary} manifestPath={manifestPath} />
      </section>
    </main>
  );
}
