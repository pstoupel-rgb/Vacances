'use client';

import { useState } from 'react';
import { createGroup, joinGroup } from '@/app/actions';

const EMOJIS = ['🎾', '🍽️', '🍷', '🏓', '⚽', '🎉', '🏖️', '🍻', '🎿', '🏀'];

export default function GroupForms() {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [emoji, setEmoji] = useState('🎾');

  return (
    <>
      <div className="sec-title">Ajouter un groupe</div>
      <div className="card">
        <div className="tabs" style={{ marginTop: 0 }}>
          <a className={tab === 'create' ? 'on' : ''} onClick={() => setTab('create')}>
            Créer
          </a>
          <a className={tab === 'join' ? 'on' : ''} onClick={() => setTab('join')}>
            Rejoindre
          </a>
        </div>

        {tab === 'create' ? (
          <form action={createGroup}>
            <input type="hidden" name="emoji" value={emoji} />
            <label className="fld">
              <span className="lab">Nom du groupe</span>
              <input className="input" name="name" placeholder="Les potes du tennis 🎾" maxLength={30} required />
            </label>
            <label className="fld">
              <span className="lab">Emoji</span>
              <div className="chips">
                {EMOJIS.map((e) => (
                  <div key={e} className={`chip ${e === emoji ? 'on' : ''}`} onClick={() => setEmoji(e)} style={{ fontSize: '1.3rem', padding: '6px 12px' }}>
                    {e}
                  </div>
                ))}
              </div>
            </label>
            <button className="btn">Créer le groupe</button>
          </form>
        ) : (
          <form action={joinGroup}>
            <label className="fld">
              <span className="lab">Code d&apos;invitation</span>
              <input className="input" name="code" placeholder="ex. 3f7a9c2b" maxLength={8} required />
            </label>
            <button className="btn">Rejoindre le groupe</button>
          </form>
        )}
      </div>
    </>
  );
}
