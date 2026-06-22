'use client';

import { useState } from 'react';
import { eur } from '@/lib/money';

// Lance Stripe Checkout pour régler son panier de vin.
export default function WinePayButton({ orderId, amount }: { orderId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount }),
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
      <button className="btn teal" onClick={pay} disabled={loading || amount <= 0}>
        {loading ? 'Redirection…' : `💳 Payer maintenant · ${eur(amount)}`}
      </button>
      {error && <p style={{ color: 'var(--red)', fontSize: '.82rem', marginTop: 8 }}>{error}</p>}
    </>
  );
}
