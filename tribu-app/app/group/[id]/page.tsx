import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TYPES, type EventRow, type Payment, type WineOrder } from '@/lib/types';
import { eur, shareOf, isSettled, collected, groupBalances } from '@/lib/money';
import EventForm from '@/components/EventForm';
import WineOrderForm from '@/components/WineOrderForm';
import PollForm from '@/components/PollForm';
import CagnotteForm from '@/components/CagnotteForm';
import Ring from '@/components/Ring';

const GRADS = ['var(--gp)', 'var(--gpk)', 'var(--gtl)', 'var(--gor)', 'var(--gbl)'];
const TABS = [
  { id: 'acts', label: 'Activités', icon: '📅' },
  { id: 'cagnotte', label: 'Cagnotte', icon: '🐷' },
  { id: 'cmd', label: 'Commandes', icon: '🍷' },
  { id: 'membres', label: 'Membres', icon: '👥' },
];

export default async function GroupPage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const tab = searchParams.tab || 'acts';

  const { data: group } = await supabase.from('groups').select('*').eq('id', params.id).single();
  if (!group) notFound();
  const idx = GRADS[(group.invite_code?.charCodeAt(0) || 0) % GRADS.length];

  const { data: memberRows } = await supabase.from('group_members').select('user_id, profiles(id, name, emoji)').eq('group_id', params.id);
  const members = (memberRows || []).map((m: any) => m.profiles).filter(Boolean);

  const { data: eventsData } = await supabase.from('events').select('*').eq('group_id', params.id).order('event_date', { ascending: true });
  const events = (eventsData || []) as EventRow[];
  const eventIds = events.map((e) => e.id);

  const partsByEvent: Record<string, string[]> = {};
  const paysByEvent: Record<string, Payment[]> = {};
  if (eventIds.length) {
    const { data: parts } = await supabase.from('event_participants').select('event_id, user_id, status').in('event_id', eventIds);
    (parts || []).forEach((p: any) => {
      if (p.status !== 'no') (partsByEvent[p.event_id] ||= []).push(p.user_id);
    });
    const { data: pays } = await supabase.from('payments').select('*').in('event_id', eventIds);
    (pays || []).forEach((p: any) => (paysByEvent[p.event_id] ||= []).push(p));
  }

  const { data: orders } = await supabase.from('wine_orders').select('*').eq('group_id', params.id).order('created_at', { ascending: false });
  const wineOrders = (orders || []) as WineOrder[];

  // Sondages (+ total de votes)
  const { data: pollRows } = await supabase.from('polls').select('id, question').eq('group_id', params.id).order('created_at', { ascending: false });
  const polls = pollRows || [];
  const voteCount: Record<string, number> = {};
  if (polls.length) {
    const { data: pv } = await supabase.from('poll_votes').select('poll_id').in('poll_id', polls.map((p: any) => p.id));
    (pv || []).forEach((v: any) => (voteCount[v.poll_id] = (voteCount[v.poll_id] || 0) + 1));
  }

  // Cagnottes (+ montant collecté)
  const { data: cagRows } = await supabase.from('cagnottes').select('*').eq('group_id', params.id).order('created_at', { ascending: false });
  const cagnottes = cagRows || [];
  const collectedByCag: Record<string, number> = {};
  if (cagnottes.length) {
    const { data: cc } = await supabase.from('cagnotte_contributions').select('cagnotte_id, amount, status').in('cagnotte_id', cagnottes.map((c: any) => c.id));
    (cc || []).forEach((c: any) => { if (c.status === 'paid') collectedByCag[c.cagnotte_id] = (collectedByCag[c.cagnotte_id] || 0) + Number(c.amount); });
  }

  const net = groupBalances(events, partsByEvent, paysByEvent, members.map((m: any) => m.id));
  const avs = members.slice(0, 6).map((m: any) => <div key={m.id} className="a">{m.emoji}</div>);

  return (
    <div>
      <div className="ghead" style={{ background: idx }}>
        <div className="htop">
          <Link href="/groups" className="back">‹</Link>
          <div style={{ flex: 1 }} />
        </div>
        <div className="center" style={{ marginTop: 6 }}>
          <div style={{ fontSize: '3rem' }}>{group.emoji}</div>
          <h1 style={{ marginTop: 6 }}>{group.name}</h1>
          <div className="hsub">{members.length} membres · code {group.invite_code}</div>
          <div className="avs" style={{ justifyContent: 'center', marginTop: 10 }}>{avs}</div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 0 }}>
        <div className="gtabs">
          {TABS.map((t) => (
            <Link key={t.id} href={`/group/${group.id}?tab=${t.id}`} className={tab === t.id ? 'on' : ''}>
              <div className="ti">{t.icon}</div>
              {t.label}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 8 }}>
          {tab === 'acts' && (
            <>
              {events.length === 0 ? (
                <div className="empty"><div className="big">🎈</div><h3>Aucune activité</h3><p>Propose un dîner, un sport, une sortie…</p></div>
              ) : (
                events.map((e) => {
                  const t = TYPES[e.type];
                  const parts = partsByEvent[e.id] || [];
                  const pays = paysByEvent[e.id] || [];
                  const foot =
                    e.payment_mode === 'split'
                      ? `${parts.filter((id) => isSettled(e, parts.length, pays, id)).length}/${parts.length} ont payé · ${eur(shareOf(Number(e.cost), parts.length))}/pers`
                      : `🏆 Cagnotte · ${eur(collected(pays))}${Number(e.cost) ? ' / ' + eur(Number(e.cost)) : ''}`;
                  return (
                    <Link key={e.id} href={`/event/${e.id}`} className="act">
                      <div className="thumb" style={{ background: t.color }}>{t.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="a-title">{e.title}</div>
                        <div className="a-meta">
                          {e.event_date && <span>{e.event_date}{e.event_time ? ' · ' + e.event_time : ''}</span>}
                          {e.place && <span>📍 {e.place}</span>}
                        </div>
                        <div className="a-meta" style={{ marginTop: 4 }}>{foot}</div>
                      </div>
                      <div className="chev">›</div>
                    </Link>
                  );
                })
              )}
              <div className="sec"><h3>Nouvelle activité</h3></div>
              <EventForm groupId={group.id} members={members} />

              <div className="sec"><h3>Sondages</h3></div>
              {polls.map((p: any) => (
                <Link key={p.id} href={`/poll/${p.id}`} className="act">
                  <div className="thumb" style={{ background: 'var(--gp)' }}>🗳️</div>
                  <div style={{ flex: 1 }}>
                    <div className="a-title">{p.question}</div>
                    <div className="a-meta"><span>{voteCount[p.id] || 0} vote(s)</span></div>
                  </div>
                  <div className="chev">›</div>
                </Link>
              ))}
              <PollForm groupId={group.id} />
            </>
          )}

          {tab === 'cagnotte' && (
            <>
              {cagnottes.length === 0 ? (
                <div className="empty"><div className="big">🐷</div><h3>Aucune cagnotte</h3><p>Collecte pour un cadeau, un resto, une commande de vin…</p></div>
              ) : (
                cagnottes.map((c: any) => {
                  const col = collectedByCag[c.id] || 0;
                  const pct = Number(c.goal) ? Math.min(100, (col / Number(c.goal)) * 100) : 0;
                  return (
                    <Link key={c.id} href={`/cagnotte/${c.id}`} className="card" style={{ display: 'block', marginBottom: 12 }}>
                      <div className="between"><div style={{ fontWeight: 700 }}>{c.title}</div></div>
                      <div className="ring-wrap" style={{ marginTop: 12 }}>
                        <Ring pct={pct} />
                        <div>
                          <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.3rem' }}>{eur(col)}</div>
                          <div className="muted" style={{ fontSize: '.8rem' }}>sur {eur(Number(c.goal))} objectif</div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
              <div style={{ height: 4 }} />
              <CagnotteForm groupId={group.id} />
            </>
          )}

          {tab === 'cmd' && (
            <>
              {wineOrders.length === 0 ? (
                <div className="empty"><div className="big">🍷</div><h3>Aucune commande</h3><p>Lance une commande groupée de vin.</p></div>
              ) : (
                wineOrders.map((o) => {
                  const st = o.status === 'closed' ? { label: 'Clôturée', cls: 'green' } : { label: 'Ouverte', cls: 'purple' };
                  return (
                    <Link key={o.id} href={`/wine/${o.id}`} className="act">
                      <div className="thumb" style={{ background: 'var(--gtl)' }}>🍷</div>
                      <div style={{ flex: 1 }}>
                        <div className="a-title">{o.title}</div>
                        <div className="a-meta"><span>{o.min_bottles ? `seuil ${o.min_bottles} bouteilles` : 'commande groupée'}{o.deadline ? ' · ' + o.deadline : ''}</span></div>
                      </div>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                    </Link>
                  );
                })
              )}
              <div className="sec"><h3>Nouvelle commande</h3></div>
              <WineOrderForm groupId={group.id} />
            </>
          )}

          {tab === 'membres' && (
            <>
              <div className="card">
                {members.map((m: any) => {
                  const n = net[m.id] || 0;
                  const cls = Math.abs(n) < 0.01 ? '' : n > 0 ? 'pos' : 'neg';
                  const txt = Math.abs(n) < 0.01 ? '' : n > 0 ? '+' + eur(n) : '−' + eur(-n);
                  return (
                    <div key={m.id} className="lrow">
                      <div className="av" style={{ width: 42, height: 42, fontSize: '1.15rem' }}>{m.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div className="l-name">{m.name} {m.id === user.id && <span className="badge purple">toi</span>}</div>
                        {Math.abs(n) >= 0.01 && <div className="l-sub">{n > 0 ? 'on lui doit' : 'doit au groupe'}</div>}
                      </div>
                      {txt && <div className={`amount ${cls}`}>{txt}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="banner" style={{ marginTop: 14 }}>
                🔗 Invite un ami avec ce code : <b style={{ color: 'var(--text)' }}>&nbsp;{group.invite_code}</b>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
