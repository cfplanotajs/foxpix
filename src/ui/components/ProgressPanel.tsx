function toneForLabel(label: string): 'info' | 'success' | 'warning' | 'error' | 'busy' {
  const l = label.toLowerCase();
  if (l.includes('working') || l.includes('preparing') || l.includes('estimating') || l.includes('processing')) return 'busy';
  if (l.includes('failed') || l.includes('error') || l.includes('unavailable')) return 'error';
  if (l.includes('warning') || l.includes('stale') || l.includes('no supported')) return 'warning';
  if (l.includes('completed') || l.includes('ready') || l.includes('copied') || l.includes('opened')) return 'success';
  return 'info';
}

export default function ProgressPanel({ busy, label }: { busy: boolean; label: string }): JSX.Element {
  const shown = busy ? `Working… ${label}` : (label || 'Idle');
  const tone = toneForLabel(shown);
  return <section className="panel"><h2>Status</h2><p className={`status-banner status-${tone}`}>{shown}</p></section>;
}
