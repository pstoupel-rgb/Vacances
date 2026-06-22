'use client';

import { useState, useTransition } from 'react';
import { deletePhoto } from '@/app/actions';

type Item = { id: string; url: string; path: string; mine: boolean };

export default function PhotoGrid({ photos, groupId }: { photos: Item[]; groupId: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [, start] = useTransition();
  const [working, setWorking] = useState('');

  const current = open !== null ? photos[open] : null;

  // Télécharge le fichier (force l'enregistrement via un blob).
  async function download(it: Item) {
    setWorking('dl');
    try {
      const res = await fetch(it.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vini-${it.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(it.url, '_blank');
    }
    setWorking('');
  }

  // Enregistrement natif iOS : ouvre la feuille de partage (« Enregistrer l'image »).
  async function saveToPhotos(it: Item) {
    setWorking('share');
    try {
      const res = await fetch(it.url);
      const blob = await res.blob();
      const file = new File([blob], `vini-${it.id.slice(0, 8)}.jpg`, { type: blob.type || 'image/jpeg' });
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file] });
      } else {
        await download(it);
      }
    } catch {
      /* annulé */
    }
    setWorking('');
  }

  if (photos.length === 0) {
    return (
      <div className="empty">
        <div className="big">📷</div>
        <h3>Aucune photo</h3>
        <p>Ajoute des photos depuis ta pellicule pour les partager avec le groupe.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {photos.map((it, i) => (
          <button
            key={it.id}
            onClick={() => setOpen(i)}
            style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--soft)', padding: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>

      {current && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,6,24,.92)', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560, margin: '0 auto' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt="" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
          <div style={{ padding: 16, display: 'flex', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <button className="btn" onClick={() => saveToPhotos(current)} disabled={!!working}>
              {working === 'share' ? '…' : '⬇️ Enregistrer'}
            </button>
            <button className="btn ghost" onClick={() => download(current)} disabled={!!working} style={{ color: '#fff', background: 'rgba(255,255,255,.15)' }}>
              {working === 'dl' ? '…' : 'Télécharger'}
            </button>
            {current.mine && (
              <button
                className="btn danger"
                style={{ background: 'transparent', color: '#fb7185', flex: '0 0 auto' }}
                onClick={() => {
                  const it = current;
                  setOpen(null);
                  start(() => deletePhoto(it.id, it.path, groupId));
                }}
              >
                🗑️
              </button>
            )}
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: '.78rem', paddingBottom: 16 }} onClick={() => setOpen(null)}>
            Toucher pour fermer
          </p>
        </div>
      )}
    </>
  );
}
