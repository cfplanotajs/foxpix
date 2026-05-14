type ActionConfig = { label: string; hotkey: string; helper: string; onClick: () => void; enabled: boolean; reason?: string; primary?: boolean };

export default function ActionBar({ preview, estimate, process, onOpenOutput, canOpenOutput }: { preview: ActionConfig; estimate: ActionConfig; process: ActionConfig; onOpenOutput: () => void; canOpenOutput: boolean }): JSX.Element {
  const disabledReason = !preview.enabled ? preview.reason : !estimate.enabled ? estimate.reason : !process.enabled ? process.reason : null;
  const renderAction = (action: ActionConfig): JSX.Element => (
    <button title={action.hotkey} type="button" onClick={action.onClick} disabled={!action.enabled} className={action.primary ? 'primary action-btn' : 'secondary action-btn'}>
      <div className="action-row"><span className="action-title">{action.label}</span><span className="shortcut-chip">{action.hotkey}</span></div>
      <span className="action-helper">{action.helper}</span>
    </button>
  );

  return (
    <section className="panel sticky-actions action-panel">
      <div className="action-grid">
        {renderAction(preview)}
        {renderAction(estimate)}
        {renderAction(process)}
      </div>
      {disabledReason ? <p className="hint warn">Disabled: {disabledReason}</p> : null}
      <div className="actions"><button type="button" onClick={onOpenOutput} disabled={!canOpenOutput} className="secondary subtle-btn">Open output folder</button></div>
    </section>
  );
}
