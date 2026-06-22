'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addPhoto } from '@/app/actions';

export default function PhotoUploader({ groupId }: { groupId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    let done = 0;
    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${groupId}/${crypto.randomUUID()}.${ext}`;
      setProgress(`Envoi ${done + 1}/${files.length}…`);
      const { error: upErr } = await supabase.storage.from('photos').upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
      if (upErr) {
        setError(upErr.message);
        break;
      }
      await addPhoto(groupId, path);
      done++;
    }
    setBusy(false);
    setProgress('');
    if (input.current) input.current.value = '';
    router.refresh();
  }

  return (
    <div>
      {/* accept=image/* + multiple => iOS propose Photothèque / Appareil photo / Fichiers */}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onPick} />
      <button className="btn" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? progress || 'Envoi…' : '📷 Ajouter des photos'}
      </button>
      {error && <p style={{ color: 'var(--red)', fontSize: '.82rem', marginTop: 8 }}>{error}</p>}
    </div>
  );
}
