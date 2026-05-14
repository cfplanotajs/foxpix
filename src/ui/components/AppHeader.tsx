export default function AppHeader(): JSX.Element {
  return (
    <section className="app-header panel">
      <div>
        <p className="eyebrow">FoxPix 2.0</p>
        <h1>FoxPix</h1>
        <p className="tagline">Batch rename, compress, and convert web assets.</p>
      </div>
      <div className="badges">
        <span className="pill">Local-only</span>
        <span className="pill">Transparency-safe</span>
        <span className="pill">WebP / AVIF / JPEG / PNG</span>
      </div>
    </section>
  );
}
