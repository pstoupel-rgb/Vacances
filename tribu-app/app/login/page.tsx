'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const supabase = createClient();
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  async function oauth(provider: 'google' | 'facebook') {
    setError('');
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setError(error.message);
      setLoading('');
    }
    // sinon : redirection vers le fournisseur
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !password) return;
    setLoading('email');
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      setLoading('');
      if (error) return setError(error.message);
      if (data.session) window.location.href = '/';
      else setInfo('Compte créé ! Vérifie tes mails pour confirmer ton adresse.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading('');
      if (error) return setError('Email ou mot de passe incorrect.');
      window.location.href = '/';
    }
  }

  return (
    <div className="wrap center" style={{ paddingTop: 70 }}>
      <div className="logo">🍷</div>
      <h1 style={{ fontSize: '2rem', marginTop: 18 }}>Vini</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 28 }}>
        Organisez, partagez et profitez entre amis
      </p>

      <button className="btn outline" onClick={() => oauth('google')} disabled={!!loading} style={{ marginBottom: 11 }}>
        <span style={{ fontWeight: 700 }}>G</span> Continuer avec Google
      </button>
      <button
        className="btn"
        onClick={() => oauth('facebook')}
        disabled={!!loading}
        style={{ background: '#1877f2', boxShadow: 'none', marginBottom: 18 }}
      >
        Continuer avec Facebook
      </button>

      <div className="row" style={{ margin: '6px 0 16px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <span className="muted" style={{ fontSize: '.78rem' }}>ou par email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>

      <form onSubmit={submitEmail} style={{ textAlign: 'left' }}>
        <label className="fld">
          <span className="lab">Email</span>
          <input className="input" type="email" required placeholder="toi@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span className="lab">Mot de passe</span>
          <input className="input" type="password" required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p style={{ color: 'var(--red)', fontSize: '.82rem', marginBottom: 12 }}>{error}</p>}
        {info && <p style={{ color: 'var(--green)', fontSize: '.82rem', marginBottom: 12 }}>{info}</p>}
        <button className="btn" disabled={!!loading}>
          {loading === 'email' ? '…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>

      <p className="muted" style={{ fontSize: '.85rem', marginTop: 18 }}>
        {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
        <button className="linktext" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}>
          {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
        </button>
      </p>
    </div>
  );
}
