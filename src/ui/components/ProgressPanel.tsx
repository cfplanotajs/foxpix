function toneForLabel(label: string): 'ok' | 'warn' | 'error' | 'idle' {
  const l = label.toLowerCase();
  if (l.includes('failed') || l.includes('error') || l.includes('unavailable')) return 'error';
  if (l.includes('no supported') || l.includes('please drop')) return 'warn';
  if (l.includes('completed') || l.includes('ready')) return 'ok';
  return 'idle';
}

export default function ProgressPanel({ busy, label }: { busy: boolean; label: string }): JSX.Element {
  const tone = toneForLabel(label || 'idle');
  return <section className="panel"><h2>Progress</h2><p className={`status ${tone}`}>{busy ? `Working… ${label}` : (label || 'Idle')}</p></section>;
}
