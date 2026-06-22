'use client';

import { useState } from 'react';
import { eur } from '@/lib/money';

// Lance une session Stripe Checkout pour payer un montant donné sur un événement.
export default function PayButton({
  eventId,
  amount,
  label,
}: {
  eventId: string;
  amount: number;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Erreur de paiement');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn green" onClick={pay} disabled={loading || amount <= 0}>
        {loading ? 'Redirection…' : `💳 ${label} · ${eur(amount)}`}
      </button>
      {error && <p style={{ color: 'var(--red)', fontSize: '.82rem', marginTop: 8 }}>{error}</p>}
    </>
  );
}
