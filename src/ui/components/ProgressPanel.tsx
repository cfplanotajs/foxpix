export default function ProgressPanel({ busy, label }: { busy: boolean; label: string }): JSX.Element {
  return <section className="panel"><h2>Progress</h2><p>{busy ? label : 'Idle'}</p></section>;
}
