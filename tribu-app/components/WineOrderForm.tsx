'use client';

import { useState } from 'react';
import { createWineOrder } from '@/app/actions';

export default function WineOrderForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="btn teal" onClick={() => setOpen(true)}>
        + Nouvelle commande de vin
      </button>
    );
  }
  return (
    <form action={createWineOrder} className="card">
      <input type="hidden" name="group_id" value={groupId} />
      <label className="fld">
        <span className="lab">Titre</span>
        <input className="input" name="title" placeholder="Commande de printemps 🍷" maxLength={40} required />
      </label>
      <div className="grid2">
        <label className="fld">
          <span className="lab">Seuil min. (bouteilles)</span>
          <input className="input" type="number" name="min_bottles" placeholder="12" min="0" />
        </label>
        <label className="fld">
          <span className="lab">Livraison prévue</span>
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
