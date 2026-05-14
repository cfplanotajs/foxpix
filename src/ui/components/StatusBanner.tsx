export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'busy';
export default function StatusBanner({ message, tone = 'info' }: { message?: string; tone?: StatusTone }): JSX.Element | null {
  if (!message) return null;
  return <div className={`status-banner status-${tone}`}><p>{message}</p></div>;
}
