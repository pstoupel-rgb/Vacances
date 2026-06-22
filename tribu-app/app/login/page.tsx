'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="pt center" style={{ paddingTop: 80 }}>
      <div className="logo">🤝</div>
      <h1 style={{ fontSize: '1.9rem', marginTop: 18 }}>Tribu</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 34 }}>
        Vos sorties entre amis, réglées en un tap
      </p>

      {sent ? (
        <div className="card center">
          <div style={{ fontSize: '2.4rem' }}>📬</div>
          <h3 style={{ marginTop: 8 }}>Vérifie tes mails</h3>
          <p className="muted" style={{ marginTop: 6, fontSize: '.88rem' }}>
            On a envoyé un lien de connexion à<br />
            <b style={{ color: 'var(--text)' }}>{email}</b>
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink} style={{ textAlign: 'left' }}>
          <label className="fld">
            <span className="lab">Ton email</span>
            <input
              className="input"
              type="email"
              required
              placeholder="toi@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 12 }}>{error}</p>
          )}
          <button className="btn" disabled={loading}>
            {loading ? 'Envoi…' : 'Recevoir mon lien de connexion'}
          </button>
        </form>
      )}
    </div>
  );
}
