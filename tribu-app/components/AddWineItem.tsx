'use client';

import { useState } from 'react';
import { addWineItem } from '@/app/actions';
import { WINE_COLORS, type WineColor, type OrderCategory } from '@/lib/types';

export default function AddWineItem({ orderId, category, unit }: { orderId: string; category: OrderCategory; unit: string }) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<WineColor>('rouge');
  const isWine = category === 'vin';

  if (!open) {
    return <button className="btn ghost" onClick={() => setOpen(true)}>+ Ajouter au catalogue</button>;
  }
  return (
    <form action={addWineItem} className="card">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="color" value={isWine ? color : 'autre'} />
      <label className="fld">
        <span className="lab">Nom</span>
        <input className="input" name="name" placeholder={isWine ? 'Pack Découverte' : 'Lot / article'} maxLength={40} required />
      </label>
      {isWine && (
        <label className="fld">
          <span className="lab">Couleur</span>
          <div className="pick">
            {(Object.entries(WINE_COLORS) as [WineColor, any][]).map(([k, c]) => (
              <button type="button" key={k} className={color === k ? 'on' : ''} onClick={() => setColor(k)}>
                <span className="pe">{c.emoji}</span>{c.label}
              </button>
            ))}
          </div>
        </label>
      )}
      <div className="grid2">
        <label className="fld">
          <span className="lab">Nb {unit}</span>
          <input className="input" type="number" name="bottles" placeholder="6" min="1" required />
        </label>
        <label className="fld">
          <span className="lab">Prix du lot (€)</span>
          <input className="input" type="number" name="price" placeholder="75" min="0" step="0.01" required />
        </label>
      </div>
      <label className="fld">
        <span className="lab">Détail (optionnel)</span>
        <input className="input" name="domaine" placeholder={isWine ? 'Domaine, millésime…' : 'Précisions'} maxLength={40} />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn teal">Ajouter</button>
      </div>
    </form>
  );
}
