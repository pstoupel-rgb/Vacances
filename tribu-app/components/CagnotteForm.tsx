'use client';

import { useState } from 'react';
import { createCagnotte } from '@/app/actions';

export default function CagnotteForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button className="btn orange" onClick={() => setOpen(true)}>+ Nouvelle cagnotte</button>;
  }
  return (
    <form action={createCagnotte} className="card">
      <input type="hidden" name="group_id" value={groupId} />
      <label className="fld">
        <span className="lab">Intitulé</span>
        <input className="input" name="title" placeholder="Cagnotte vin rouge 🍷" maxLength={40} required />
      </label>
      <label className="fld">
        <span className="lab">Objectif (€)</span>
        <input className="input" type="number" name="goal" placeholder="200" min="1" step="0.01" />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn orange">Créer la cagnotte</button>
      </div>
    </form>
  );
}
