'use client';

import { useState } from 'react';
import { createEvent } from '@/app/actions';
import { TYPES, type EventType, type PaymentMode } from '@/lib/types';

export default function EventForm({ groupId, members }: { groupId: string; members: any[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EventType>('diner');
  const [mode, setMode] = useState<PaymentMode>('split');
  const [parts, setParts] = useState<string[]>([]);

  function toggle(id: string) {
    setParts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        ＋ Proposer une sortie
      </button>
    );
  }

  return (
    <form action={createEvent} className="card">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="payment_mode" value={mode} />

      <label className="fld">
        <span className="lab">Type</span>
        <div className="pick">
          {(Object.entries(TYPES) as [EventType, any][]).map(([k, t]) => (
            <button type="button" key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>
              <span className="pe">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </label>

      <label className="fld">
        <span className="lab">Titre</span>
        <input className="input" name="title" placeholder="Padel dimanche matin" maxLength={40} required />
      </label>

      <div className="grid2">
        <label className="fld">
          <span className="lab">Date</span>
          <input className="input" type="date" name="event_date" />
        </label>
        <label className="fld">
          <span className="lab">Heure</span>
          <input className="input" type="time" name="event_time" />
        </label>
      </div>

      <label className="fld">
        <span className="lab">Lieu</span>
        <input className="input" name="place" placeholder="Padel Club Paris 12" maxLength={40} />
      </label>

      <label className="fld">
        <span className="lab">Mode de paiement</span>
        <div className="pick">
          <button type="button" className={mode === 'split' ? 'on' : ''} onClick={() => setMode('split')}>
            <span className="pe">⇄</span>
            Partage
          </button>
          <button type="button" className={mode === 'cagnotte' ? 'on' : ''} onClick={() => setMode('cagnotte')}>
            <span className="pe">🏆</span>
            Cagnotte
          </button>
        </div>
      </label>

      <label className="fld">
        <span className="lab">
          {mode === 'split' ? "Montant total de l'addition (€)" : 'Objectif de la cagnotte (€, optionnel)'}
        </span>
        <input className="input" type="number" inputMode="decimal" name="cost" placeholder="0" min="0" step="0.01" />
      </label>

      {mode === 'split' && (
        <label className="fld">
          <span className="lab">Participants</span>
          <div className="chips">
            {members.map((m) => (
              <div key={m.id} className={`chip ${parts.includes(m.id) ? 'on' : ''}`} onClick={() => toggle(m.id)}>
                {m.emoji} {m.name?.split(' ')[0]}
                {parts.includes(m.id) && <span style={{ color: 'var(--brand2)', fontWeight: 700 }}>✓</span>}
              </div>
            ))}
          </div>
          {parts.map((id) => (
            <input key={id} type="hidden" name="participant" value={id} />
          ))}
        </label>
      )}

      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button className="btn">Créer</button>
      </div>
    </form>
  );
}
