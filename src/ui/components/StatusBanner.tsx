export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'busy';
export default function StatusBanner({ message, tone = 'info' }: { message?: string; tone?: StatusTone }): JSX.Element | null {
  if (!message) return null;
  return <div className={`status-banner status-${tone}`} role="status" aria-live="polite"><p>{message}</p></div>;
}
