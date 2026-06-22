import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TYPES, type EventRow, type Payment } from '@/lib/types';
import { eur, shareOf, isSettled, collected, groupBalances, paidBy } from '@/lib/money';
import EventForm from '@/components/EventForm';

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tab = searchParams.tab || 'events';

  const { data: group } = await supabase.from('groups').select('*').eq('id', params.id).single();
  if (!group) notFound();

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, name, emoji)')
    .eq('group_id', params.id);
  const members = (memberRows || []).map((m: any) => m.profiles).filter(Boolean);
  const memberIds = members.map((m: any) => m.id);

  const { data: eventsData } = await supabase
    .from('events')
    .select('*')
    .eq('group_id', params.id)
    .order('event_date', { ascending: false });
  const events = (eventsData || []) as EventRow[];
  const eventIds = events.map((e) => e.id);

  const partsByEvent: Record<string, string[]> = {};
  const paysByEvent: Record<string, Payment[]> = {};
  if (eventIds.length) {
    const { data: parts } = await supabase
      .from('event_participants')
      .select('event_id, user_id')
      .in('event_id', eventIds);
    (parts || []).forEach((p: any) => {
      (partsByEvent[p.event_id] ||= []).push(p.user_id);
    });
    const { data: pays } = await supabase.from('payments').select('*').in('event_id', eventIds);
    (pays || []).forEach((p: any) => {
      (paysByEvent[p.event_id] ||= []).push(p);
    });
  }

  return (
    <div className="pt">
      <div className="topbar">
        <Link href="/" className="back">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem' }}>
            {group.emoji} {group.name}
          </h1>
          <div className="sub">
            {members.length} membres · code {group.invite_code}
          </div>
        </div>
      </div>

      <div className="tabs">
        <Link href={`/group/${group.id}?tab=events`} className={tab === 'events' ? 'on' : ''}>
          Événements
        </Link>
        <Link href={`/group/${group.id}?tab=balances`} className={tab === 'balances' ? 'on' : ''}>
          Soldes
        </Link>
        <Link href={`/group/${group.id}?tab=members`} className={tab === 'members' ? 'on' : ''}>
          Membres
        </Link>
      </div>

      {tab === 'events' && (
        <>
          {events.length === 0 ? (
            <div className="empty">
              <div className="big">🎈</div>
              <h3>Aucun événement</h3>
              <p>Lance une demande : dîner, tennis, padel, resto…</p>
            </div>
          ) : (
            events.map((e) => {
              const t = TYPES[e.type];
              const parts = partsByEvent[e.id] || [];
              const pays = paysByEvent[e.id] || [];
              let foot;
              if (e.payment_mode === 'split') {
                const settled = parts.filter((id) => isSettled(e, parts.length, pays, id)).length;
                foot = (
                  <>
                    <span className="tag split">⇄ Partage</span>
                    <span className="muted" style={{ fontSize: '.78rem' }}>
                      {settled}/{parts.length} ont payé · {eur(shareOf(Number(e.cost), parts.length))}/pers
                    </span>
                  </>
                );
              } else {
                const c = collected(pays);
                foot = (
                  <>
                    <span className="tag cagnotte">🏆 Cagnotte</span>
                    <span className="muted" style={{ fontSize: '.78rem' }}>
                      {eur(c)}
                      {Number(e.cost) ? ' / ' + eur(Number(e.cost)) : ''}
                    </span>
                  </>
                );
              }
              return (
                <Link key={e.id} href={`/event/${e.id}`} className="event">
                  <div className="ico" style={{ background: t.color + '22' }}>
                    {t.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="e-title">{e.title}</div>
                    <div className="e-meta">
                      {e.event_date && (
                        <span>
                          📅 {e.event_date}
                          {e.event_time ? ' · ' + e.event_time : ''}
                        </span>
                      )}
                      {e.place && <span>📍 {e.place}</span>}
                    </div>
                    <div className="e-foot">{foot}</div>
                  </div>
                </Link>
              );
            })
          )}
          <div className="sec-title">Nouvelle demande</div>
          <EventForm groupId={group.id} members={members} />
        </>
      )}

      {tab === 'balances' && <Balances events={events} partsByEvent={partsByEvent} paysByEvent={paysByEvent} members={members} meId={user.id} />}

      {tab === 'members' && (
        <div className="card">
          {members.map((m: any) => (
            <div key={m.id} className="lrow">
              <div className="av" style={{ width: 42, height: 42, background: '#7c5cff22', border: '1px solid #7c5cff55', fontSize: '1.15rem' }}>
                {m.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div className="l-name">
                  {m.name} {m.id === user.id && <span className="badge">toi</span>}
                </div>
              </div>
            </div>
          ))}
          <div className="hr" />
          <p className="muted" style={{ fontSize: '.82rem', lineHeight: 1.5 }}>
            Partage ce code pour inviter un ami : <b style={{ color: 'var(--text)' }}>{group.invite_code}</b>
          </p>
        </div>
      )}
    </div>
  );
}

function Balances({
  events,
  partsByEvent,
  paysByEvent,
  members,
  meId,
}: {
  events: EventRow[];
  partsByEvent: Record<string, string[]>;
  paysByEvent: Record<string, Payment[]>;
  members: any[];
  meId: string;
}) {
  const hasSplit = events.some((e) => e.payment_mode === 'split');
  if (!hasSplit) {
    return (
      <div className="empty">
        <div className="big">⚖️</div>
        <h3>Aucun solde</h3>
        <p>
          Les soldes apparaissent avec les événements en <b>partage d&apos;addition</b>.
        </p>
      </div>
    );
  }
  const net = groupBalances(
    events,
    partsByEvent,
    paysByEvent,
    members.map((m) => m.id)
  );
  return (
    <div className="card">
      {members.map((m) => {
        const n = net[m.id] || 0;
        const cls = Math.abs(n) < 0.01 ? '' : n > 0 ? 'pos' : 'neg';
        const txt = Math.abs(n) < 0.01 ? 'à jour' : n > 0 ? '+' + eur(n) : '−' + eur(-n);
        return (
          <div key={m.id} className="lrow">
            <div className="av" style={{ width: 42, height: 42, background: '#7c5cff22', border: '1px solid #7c5cff55', fontSize: '1.15rem' }}>
              {m.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div className="l-name">
                {m.name} {m.id === meId && <span className="badge">toi</span>}
              </div>
              <div className="l-sub">{n > 0 ? 'on lui doit' : n < -0.01 ? 'doit au groupe' : 'équilibré'}</div>
            </div>
            <div className={`amount ${cls}`}>{txt}</div>
          </div>
        );
      })}
    </div>
  );
}
