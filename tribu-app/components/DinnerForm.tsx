'use client';

import { useState } from 'react';
import { createDinner } from '@/app/actions';

export default function DinnerForm() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [ephemeral, setEphemeral] = useState(false);

  const setEmail = (i: number, v: string) => setEmails((e) => e.map((x, j) => (j === i ? v : x)));
  const addEmail = () => setEmails((e) => [...e, '']);
  const removeEmail = (i: number) => setEmails((e) => e.filter((_, j) => j !== i));

  return (
    <form action={createDinner}>
      <input type="hidden" name="ephemeral" value={ephemeral ? 'on' : ''} />

      <label className="fld">
        <span className="lab">Titre du dîner</span>
        <input className="input" name="title" placeholder="Dîner italien 🍝" maxLength={40} required />
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
        <input className="input" name="place" placeholder="Trattoria Bella" maxLength={40} />
      </label>

      <label className="fld">
        <span className="lab">Budget estimé (€, optionnel)</span>
        <input className="input" type="number" name="cost" placeholder="0" min="0" step="0.01" />
      </label>

      <div className="sec" style={{ margin: '4px 2px 10px' }}><h3 style={{ fontSize: '.95rem' }}>Inviter par email</h3></div>
      {emails.map((e, i) => (
        <div className="row" key={i} style={{ marginBottom: 9 }}>
          <input className="input" type="email" placeholder="ami@email.com" value={e} onChange={(ev) => setEmail(i, ev.target.value)} />
          {e && <input type="hidden" name="email" value={e} />}
          {emails.length > 1 && (
            <button type="button" className="btn ghost small" onClick={() => removeEmail(i)} aria-label="retirer">✕</button>
          )}
        </div>
      ))}
      <button type="button" className="btn ghost small" style={{ marginBottom: 16 }} onClick={addEmail}>+ Ajouter un email</button>

      <div className="sec" style={{ margin: '4px 2px 10px' }}><h3 style={{ fontSize: '.95rem' }}>Type de groupe</h3></div>
      <div className="pick" style={{ marginBottom: 18 }}>
        <button type="button" className={!ephemeral ? 'on' : ''} onClick={() => setEphemeral(false)}>
          <span className="pe">♾️</span>Réutilisable
        </button>
        <button type="button" className={ephemeral ? 'on' : ''} onClick={() => setEphemeral(true)}>
          <span className="pe">✨</span>Éphémère
        </button>
      </div>
      <p className="muted" style={{ fontSize: '.78rem', marginBottom: 16, lineHeight: 1.5 }}>
        {ephemeral
          ? 'Groupe dédié à ce dîner uniquement.'
          : 'Vrai groupe : vous pourrez y refaire des activités, cagnottes et commandes de vin.'}
      </p>

      <button className="btn">C&apos;est parti — créer le dîner</button>
      <p className="muted center" style={{ fontSize: '.76rem', marginTop: 10 }}>
        Le groupe est créé et tes invités le rejoignent en se connectant avec leur email.
      </p>
    </form>
  );
}
