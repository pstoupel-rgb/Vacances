import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TYPES, type EventRow } from '@/lib/types';

const GRADS = ['var(--gp)', 'var(--gpk)', 'var(--gtl)', 'var(--gor)', 'var(--gbl)'];

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Rejoint automatiquement les groupes où l'utilisateur a été invité par email.
  await supabase.rpc('claim_invites');

  const { data: profile } = await supabase.from('profiles').select('name, emoji').eq('id', user.id).single();

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name, emoji)')
    .order('joined_at', { ascending: false });
  const groups = (memberships || []).map((m: any) => m.groups).filter(Boolean);
  const groupIds = groups.map((g: any) => g.id);

  let upcoming: { g: any; e: EventRow }[] = [];
  if (groupIds.length) {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('group_id', groupIds)
      .order('event_date', { ascending: true })
      .limit(6);
    const byId: Record<string, any> = {};
    groups.forEach((g: any) => (byId[g.id] = g));
    upcoming = (events || []).map((e: any) => ({ g: byId[e.group_id], e }));
  }

  const firstName = (profile?.name || 'Ami').split(' ')[0];

  return (
    <div>
      <div className="ghead">
        <div className="htop">
          <div style={{ flex: 1 }}>
            <h1>Bonjour {firstName} 👋</h1>
            <div className="hsub">Tes groupes & activités</div>
          </div>
          <Link href="/profile" className="ic-btn solid">
            {profile?.emoji || '😎'}
          </Link>
        </div>
      </div>

      <div className="wrap">
        <Link href="/dinner/new" className="act" style={{ background: 'var(--gor)', color: '#fff', marginTop: 4 }}>
          <div className="thumb" style={{ background: 'rgba(255,255,255,.22)' }}>🍝</div>
          <div style={{ flex: 1 }}>
            <div className="a-title" style={{ color: '#fff' }}>Organiser un dîner</div>
            <div style={{ fontSize: '.78rem', opacity: 0.92 }}>Invite par email, le groupe se crée tout seul</div>
          </div>
          <div className="chev" style={{ color: '#fff' }}>›</div>
        </Link>

        <div className="sec">
          <h3>Mes groupes</h3>
          <Link href="/groups" className="link">Voir tout</Link>
        </div>
        <div className="rail">
          {groups.map((g: any, i: number) => (
            <Link key={g.id} href={`/group/${g.id}`} className="gtile">
              <div className="ph" style={{ background: GRADS[i % GRADS.length] }}>{g.emoji}</div>
              <div className="nm">{g.name}</div>
            </Link>
          ))}
          <Link href="/groups" className="gtile">
            <div className="ph" style={{ background: 'var(--soft)', color: 'var(--purple)', fontSize: '2rem', border: '1.5px dashed #d7d2ea' }}>+</div>
            <div className="nm">Créer<br />un groupe</div>
          </Link>
        </div>

        <div className="sec">
          <h3>À venir</h3>
          <Link href="/activities" className="link">Voir tout</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card center muted" style={{ padding: 22, fontSize: '.88rem' }}>
            Aucune activité à venir.<br />Crée-en une dans un groupe 👇
          </div>
        ) : (
          upcoming.map(({ g, e }) => {
            const t = TYPES[e.type];
            return (
              <Link key={e.id} href={`/event/${e.id}`} className="act">
                <div className="thumb" style={{ background: t.color }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="a-title">{e.title}</div>
                  <div className="a-meta">
                    {e.event_date && <span>{e.event_date}{e.event_time ? ' · ' + e.event_time : ''}</span>}
                    {e.place && <span>📍 {e.place}</span>}
                  </div>
                  <div className="a-meta" style={{ marginTop: 4 }}>{g?.emoji} {g?.name}</div>
                </div>
                <div className="chev">›</div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
