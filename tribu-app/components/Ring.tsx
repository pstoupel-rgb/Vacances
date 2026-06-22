// Anneau de progression (SVG). Composant serveur pur.
export default function Ring({ pct, from = '#fb923c', to = '#f97316' }: { pct: number; from?: string; to?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const id = 'rg' + Math.round(pct) + from.replace('#', '');
  return (
    <div className="ring">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f0eef8" strokeWidth="9" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="pct">{Math.round(pct)}%</div>
    </div>
  );
}
