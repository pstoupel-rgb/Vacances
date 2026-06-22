'use client';

import { useState } from 'react';
import { createWineOrder } from '@/app/actions';
import { ORDER_CATS, type OrderCategory } from '@/lib/types';

export default function WineOrderForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<OrderCategory>('vin');

  if (!open) {
    return (
      <button className="btn teal" onClick={() => setOpen(true)}>
        + Nouvelle commande groupée
      </button>
    );
  }
  const c = ORDER_CATS[cat];
  return (
    <form action={createWineOrder} className="card">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="category" value={cat} />

      <label className="fld">
        <span className="lab">Catégorie</span>
        <div className="pick">
          {(Object.entries(ORDER_CATS) as [OrderCategory, any][]).map(([k, v]) => (
            <button type="button" key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>
              <span className="pe">{v.emoji}</span>{v.label}
            </button>
          ))}
        </div>
      </label>

      <label className="fld">
        <span className="lab">Titre</span>
        <input className="input" name="title" placeholder={cat === 'vin' ? 'Commande de printemps 🍷' : 'Cagnotte / commande groupée'} maxLength={40} required />
      </label>
      <div className="grid2">
        <label className="fld">
          <span className="lab">Seuil min. ({c.unit})</span>
          <input className="input" type="number" name="min_bottles" placeholder="12" min="0" />
        </label>
        <label className="fld">
          <span className="lab">Date prévue</span>
          <input className="input" type="date" name="deadline" />
        </label>
      </div>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn teal">Créer la commande</button>
      </div>
    </form>
  );
}
