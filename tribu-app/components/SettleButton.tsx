'use client';

import { useState } from 'react';
import { eur } from '@/lib/money';

export default function SettleButton({ groupId, toUser, toName, amount }: { groupId: string; toUser: string; toName: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settleToUser: toUser, groupId, amount }),
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
      <button className="btn small" onClick={pay} disabled={loading}>
        {loading ? '…' : `Rembourser ${eur(amount)}`}
      </button>
      {error && <p style={{ color: 'var(--red)', fontSize: '.78rem', marginTop: 6 }}>{error}</p>}
    </>
  );
}
