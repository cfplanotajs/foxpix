import type { ReactNode } from 'react';
export default function EmptyState({ title, description, steps, footer, children }: { title: string; description: string; steps?: string[]; footer?: string; children?: ReactNode }): JSX.Element {
  return <div className="empty-state"><h3>{title}</h3><p className="hint">{description}</p>{steps ? <ol>{steps.map((s) => <li key={s}>{s}</li>)}</ol> : null}{children ? <div className="actions">{children}</div> : null}{footer ? <p className="hint">{footer}</p> : null}</div>;
}
