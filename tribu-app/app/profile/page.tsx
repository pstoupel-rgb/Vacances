import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/ProfileEditor';
import ConnectButton from '@/components/ConnectButton';
import { signOut } from '../actions';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('name, emoji').eq('id', user.id).single();
  const { data: acct } = await supabase.from('stripe_accounts').select('charges_enabled').eq('user_id', user.id).maybeSingle();

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <div style={{ flex: 1 }}><h1>Profil</h1></div>
        </div>
        <div className="center" style={{ marginTop: 8 }}>
          <div className="ic-btn solid" style={{ width: 84, height: 84, fontSize: '2.4rem', margin: '0 auto' }}>{profile?.emoji || '😎'}</div>
          <h2 style={{ marginTop: 12 }}>{profile?.name || 'Ami'}</h2>
          <div className="hsub">{user.email}</div>
        </div>
      </div>

      <div className="wrap">
        <ProfileEditor name={profile?.name || ''} emoji={profile?.emoji || '😎'} />

        <div style={{ height: 14 }} />
        <a href="/orders" className="act">
          <div className="thumb" style={{ background: 'var(--gtl)' }}>🍷</div>
          <div style={{ flex: 1 }}>
            <div className="a-title">Mes commandes de vin</div>
            <div className="a-meta"><span>Suivi de tes commandes groupées</span></div>
          </div>
          <div className="chev">›</div>
        </a>

        <div className="banner" style={{ marginTop: 16 }}>
          ⚡ Active les encaissements pour recevoir l&apos;argent des sorties &amp; commandes que tu organises.
        </div>
        <div className="card">
          <p className="muted" style={{ fontSize: '.82rem', lineHeight: 1.5, marginBottom: 10 }}>
            Paiements via Stripe — parts, cagnottes et commandes de vin sont reversés à l&apos;organisateur.
          </p>
          <ConnectButton enabled={!!acct?.charges_enabled} />
        </div>

        <div style={{ height: 14 }} />
        <form action={signOut}>
          <button className="btn danger">Se déconnecter</button>
        </form>
        <p className="muted center" style={{ fontSize: '.74rem', marginTop: 18 }}>Vini · v1</p>
      </div>
    </div>
  );
}
