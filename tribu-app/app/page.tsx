import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GroupForms from '@/components/GroupForms';
import ProfileEditor from '@/components/ProfileEditor';
import ConnectButton from '@/components/ConnectButton';
import { signOut } from './actions';

const GRADIENTS = [
  'linear-gradient(140deg,#7c5cff,#22d3ee)',
  'linear-gradient(140deg,#f5576c,#f093fb)',
  'linear-gradient(140deg,#11998e,#38ef7d)',
  'linear-gradient(140deg,#fa709a,#fee140)',
  'linear-gradient(140deg,#4facfe,#00f2fe)',
];

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, emoji')
    .eq('id', user.id)
    .single();

  // Groupes dont je suis membre.
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, emoji, invite_code)')
    .order('joined_at', { ascending: false });

  const groups = (memberships || [])
    .map((m: any) => m.groups)
    .filter(Boolean);

  // Compte des membres par groupe.
  const counts: Record<string, number> = {};
  for (const g of groups) {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id);
    counts[g.id] = count || 1;
  }

  const { data: acct } = await supabase
    .from('stripe_accounts')
    .select('charges_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  const firstName = (profile?.name || 'Ami').split(' ')[0];

  return (
    <div className="pt">
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1>Salut {firstName} 👋</h1>
          <div className="sub">Tes groupes & sorties</div>
        </div>
        <form action={signOut}>
          <button className="pill" style={{ background: 'var(--brand)' }} title="Profil / Déconnexion">
            {profile?.emoji || '😎'}
          </button>
        </form>
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <div className="big">👋</div>
          <h3>Aucun groupe pour l&apos;instant</h3>
          <p>Crée ton premier groupe ou rejoins celui d&apos;un ami avec un code d&apos;invitation.</p>
        </div>
      ) : (
        groups.map((g: any, i: number) => (
          <Link key={g.id} href={`/group/${g.id}`} className="group-card" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
            <div className="gc-emoji">{g.emoji}</div>
            <h3>{g.name}</h3>
            <div className="gc-meta">
              {counts[g.id]} membre{counts[g.id] > 1 ? 's' : ''} · code : {g.invite_code}
            </div>
          </Link>
        ))
      )}

      <GroupForms />

      <div className="sec-title">Réglages</div>
      <div className="card">
        <div className="between">
          <div className="row">
            <div className="pill" style={{ background: 'var(--brand)' }}>{profile?.emoji || '😎'}</div>
            <b>{profile?.name || 'Ami'}</b>
          </div>
          <ProfileEditor name={profile?.name || ''} emoji={profile?.emoji || '😎'} />
        </div>
        <div className="hr" />
        <p className="muted" style={{ fontSize: '.82rem', lineHeight: 1.5, marginBottom: 10 }}>
          Active les encaissements pour recevoir l&apos;argent des sorties que tu organises (parts &amp; cagnottes), via Stripe.
        </p>
        <ConnectButton enabled={!!acct?.charges_enabled} />
        <div className="hr" />
        <form action={signOut}>
          <button className="btn danger">Se déconnecter</button>
        </form>
      </div>
    </div>
  );
}
