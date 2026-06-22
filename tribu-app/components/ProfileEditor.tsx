'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/actions';

const EMOJIS = ['😎', '🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🐧', '🤖', '🔥', '🌟'];

export default function ProfileEditor({ name, emoji }: { name: string; emoji: string }) {
  const [open, setOpen] = useState(false);
  const [em, setEm] = useState(emoji);

  if (!open) {
    return (
      <button className="btn ghost small" onClick={() => setOpen(true)}>
        Modifier mon profil
      </button>
    );
  }

  return (
    <form action={updateProfile}>
      <input type="hidden" name="emoji" value={em} />
      <label className="fld">
        <span className="lab">Prénom</span>
        <input className="input" name="name" defaultValue={name} maxLength={20} required />
      </label>
      <label className="fld">
        <span className="lab">Avatar</span>
        <div className="chips">
          {EMOJIS.map((e) => (
            <div key={e} className={`chip ${e === em ? 'on' : ''}`} onClick={() => setEm(e)} style={{ fontSize: '1.3rem', padding: '6px 12px' }}>
              {e}
            </div>
          ))}
        </div>
      </label>
      <button className="btn">Enregistrer</button>
    </form>
  );
}
