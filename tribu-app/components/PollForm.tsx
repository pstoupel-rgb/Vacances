'use client';

import { useState } from 'react';
import { createPoll } from '@/app/actions';

export default function PollForm({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(['', '']);

  if (!open) {
    return <button className="btn ghost" onClick={() => setOpen(true)}>📊 Lancer un sondage</button>;
  }
  return (
    <form action={createPoll} className="card">
      <input type="hidden" name="group_id" value={groupId} />
      <label className="fld">
        <span className="lab">Question</span>
        <input className="input" name="question" placeholder="Quel jour vous arrange ?" maxLength={60} required />
      </label>
      <span className="lab" style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: 7 }}>Options</span>
      {options.map((o, i) => (
        <input
          key={i}
          className="input"
          name="option"
          placeholder={`Option ${i + 1}`}
          value={o}
          onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
          style={{ marginBottom: 9 }}
        />
      ))}
      <button type="button" className="btn ghost small" style={{ marginBottom: 14 }} onClick={() => setOptions((a) => [...a, ''])}>
        + Ajouter une option
      </button>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn">Créer le sondage</button>
      </div>
    </form>
  );
}
