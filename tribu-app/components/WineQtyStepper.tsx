'use client';

import { useState, useTransition } from 'react';
import { setWinePick } from '@/app/actions';

export default function WineQtyStepper({ orderId, itemId, initial }: { orderId: string; itemId: string; initial: number }) {
  const [qty, setQty] = useState(initial);
  const [, start] = useTransition();

  function change(next: number) {
    const q = Math.max(0, next);
    setQty(q);
    start(() => setWinePick(orderId, itemId, q));
  }

  return (
    <div className="stepper">
      <button onClick={() => change(qty - 1)}>−</button>
      <div className="q">{qty}</div>
      <button onClick={() => change(qty + 1)}>+</button>
    </div>
  );
}
