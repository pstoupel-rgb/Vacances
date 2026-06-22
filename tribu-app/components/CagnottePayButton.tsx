'use client';

import { useState } from 'react';

export default function CagnottePayButton({ cagnotteId }: { cagnotteId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Entre un montant');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cagnotteId, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Erreur de paiement');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  if (!open) {
    return <button className="btn orange" onClick={() => setOpen(true)}>💳 Contribuer</button>;
  }
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        {[10, 20, 50].map((a) => (
          <button key={a} type="button" className="btn ghost small" onClick={() => setAmount(String(a))}>{a} €</button>
        ))}
      </div>
      <input className="input" type="number" inputMode="decimal" placeholder="Montant (€)" value={amount} min="1" step="0.01" onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: 10 }} />
      {error && <p style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 8 }}>{error}</p>}
      <button className="btn orange" onClick={pay} disabled={loading}>{loading ? 'Redirection…' : 'Continuer vers le paiement'}</button>
    </div>
  );
}
