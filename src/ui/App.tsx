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

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateOptions(options: GuiOptions): string | null {
  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) {
    return 'Quality must be an integer between 1 and 100.';
  }
  if (!Number.isInteger(options.alphaQuality) || options.alphaQuality < 0 || options.alphaQuality > 100) {
    return 'Alpha quality must be an integer between 0 and 100.';
  }
  if (options.maxWidth !== undefined && (!Number.isInteger(options.maxWidth) || options.maxWidth < 1)) {
    return 'Max width must be a positive integer when provided.';
  }
  if (options.maxHeight !== undefined && (!Number.isInteger(options.maxHeight) || options.maxHeight < 1)) {
    return 'Max height must be a positive integer when provided.';
  }
  return null;
}

export default function App(): JSX.Element {
  const [options, setOptions] = useState<GuiOptions>(defaults);
  const [outputTouched, setOutputTouched] = useState(false);
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

  const validationError = validateOptions(options);

  const pickInput = async (): Promise<void> => {
    const picked = await window.foxpix.selectInputFolder();
    if (!picked) return;

    if (outputTouched) {
      setOptions((prev) => ({ ...prev, input: picked }));
    } else {
      setOptions((prev) => ({ ...prev, input: picked, output: `${picked}/optimized` }));
    }
  };

  const pickOutput = async (): Promise<void> => {
    const picked = await window.foxpix.selectOutputFolder();
    if (picked) {
      setOptions((prev) => ({ ...prev, output: picked }));
      setOutputTouched(true);
    }
  };

  const handlePreview = async (): Promise<void> => {
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setBusy(true);
    setStatus('Preparing preview...');
    try {
      const result = await window.foxpix.preview({ ...options, output: options.output || undefined });
      setPreviewRows(result.rows);
      setStatus(`Preview ready (${result.total} files).`);
    } catch (error) {
      setStatus(`Preview failed: ${toMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleProcess = async (): Promise<void> => {
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setBusy(true);
    setStatus('Processing batch...');
    try {
      const result = await window.foxpix.process({ ...options, output: options.output || undefined });
      setSummary(result.summary);
      setManifestPath(result.manifestPath);
      setStatus(`Completed: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed.`);
    } catch (error) {
      setStatus(`Processing failed: ${toMessage(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app">
      <section className="left">
        <h1>FoxPix GUI MVP</h1>
        <FolderPicker input={options.input} output={outputDisplay} onInputPick={pickInput} onOutputPick={pickOutput} />
        <SettingsPanel options={options} onChange={setOptions} disabled={busy} />
        <div className="actions">
          <button type="button" onClick={() => void handlePreview()} disabled={busy || !options.input || Boolean(validationError)}>Preview (dry run)</button>
          <button type="button" onClick={() => void handleProcess()} disabled={busy || !options.input || Boolean(validationError)}>Process</button>
          <button type="button" onClick={() => void window.foxpix.openFolder(outputDisplay)} disabled={!outputDisplay}>Open output folder</button>
        </div>
      </section>
      <section className="right">
        <ProgressPanel busy={busy} label={validationError ?? status} />
        <PreviewTable rows={previewRows} />
        <SummaryPanel summary={summary} manifestPath={manifestPath} />
      </section>
    </main>
  );
}
