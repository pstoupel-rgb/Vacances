'use client';

import { useState } from 'react';

// Lance l'onboarding Stripe Connect pour pouvoir encaisser en tant qu'organisateur.
export default function ConnectButton({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch('/api/connect', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  if (enabled) {
    return <div className="badge paid" style={{ display: 'inline-block' }}>✓ Encaissements activés</div>;
  }

  return (
    <button className="btn ghost small" onClick={start} disabled={loading}>
      {loading ? '…' : '💶 Activer les encaissements (Stripe)'}
    </button>
  );
}
