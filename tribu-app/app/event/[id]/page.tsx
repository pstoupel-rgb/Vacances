import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TYPES, type EventRow, type Payment } from '@/lib/types';
import { eur, shareOf, paidBy, isSettled, collected } from '@/lib/money';
import PayButton from '@/components/PayButton';
import ContributeButton from '@/components/ContributeButton';
import JoinLeave from '@/components/JoinLeave';
import { deleteEvent } from '@/app/actions';

export default async function EventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paid?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: e } = await supabase.from('events').select('*').eq('id', params.id).single();
  if (!e) notFound();
  const event = e as EventRow;
  const t = TYPES[event.type];

  const { data: group } = await supabase.from('groups').select('id, name, emoji').eq('id', event.group_id).single();

  const { data: partRows } = await supabase
    .from('event_participants')
    .select('user_id, profiles(id, name, emoji)')
    .eq('event_id', event.id);
  const participants = (partRows || []).map((p: any) => ({ id: p.user_id, ...p.profiles }));

  const { data: payRows } = await supabase.from('payments').select('*').eq('event_id', event.id);
  const payments = (payRows || []) as Payment[];

  // Profils des contributeurs (pour la cagnotte, ils ne sont pas forcément "participants").
  const profById: Record<string, any> = {};
  participants.forEach((p: any) => (profById[p.id] = p));
  const missing = payments.map((p) => p.user_id).filter((id) => !profById[id]);
  if (missing.length) {
    const { data: extra } = await supabase.from('profiles').select('id, name, emoji').in('id', missing);
    (extra || []).forEach((p: any) => (profById[p.id] = p));
  }

  const { data: orgProfile } = await supabase.from('profiles').select('name').eq('id', event.organizer_id).single();

  const meIn = participants.some((p: any) => p.id === user.id);
  const myShare = shareOf(Number(event.cost), participants.length);
  const myPaid = paidBy(payments, user.id);
  const settled = isSettled(event, participants.length, payments, user.id);

  return (
    <div className="pt">
      <div className="topbar">
        <Link href={`/group/${event.group_id}`} className="back">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.25rem' }}>{event.title}</h1>
          <div className="sub">
            {t.emoji} {t.label}
            {orgProfile ? ' · organisé par ' + (orgProfile.name || '').split(' ')[0] : ''}
          </div>
        </div>
      </div>

      {searchParams.paid === '1' && (
        <div className="banner" style={{ color: 'var(--green)' }}>
          ✓ Paiement confirmé, merci !
        </div>
      )}

      <div className="card" style={{ background: t.color + '1a', borderColor: t.color + '44' }}>
        <div className="row">
          <div className="ico" style={{ width: 54, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', background: t.color + '33' }}>
            {t.emoji}
          </div>
          <div>
            {event.event_date && (
              <div>
                <b>{event.event_date}</b>
                {event.event_time ? ' · ' + event.event_time : ''}
              </div>
            )}
            {event.place && <div className="muted" style={{ fontSize: '.85rem', marginTop: 2 }}>📍 {event.place}</div>}
            {event.note && <div className="muted" style={{ fontSize: '.82rem', marginTop: 6 }}>{event.note}</div>}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {event.payment_mode === 'split' ? (
        <>
          <div className="card">
            <div className="between">
              <span className="muted">Addition totale</span>
              <b>{eur(Number(event.cost))}</b>
            </div>
            <div className="between" style={{ marginTop: 8 }}>
              <span className="muted">Par personne ({participants.length})</span>
              <b>{eur(myShare)}</b>
            </div>
            {meIn && !settled && (
              <div style={{ marginTop: 14 }}>
                <PayButton eventId={event.id} amount={Math.round((myShare - myPaid) * 100) / 100} label="Payer ma part" />
              </div>
            )}
            {meIn && settled && <div className="badge paid" style={{ marginTop: 14, display: 'inline-block' }}>✓ Ta part est réglée</div>}
            {!meIn && (
              <div style={{ marginTop: 14 }}>
                <JoinLeave eventId={event.id} groupId={event.group_id} joined={false} />
              </div>
            )}
          </div>

          <div className="sec-title">
            Participants <span className="count">{participants.length}</span>
          </div>
          <div className="card">
            {participants.length === 0 && <span className="muted">Personne pour l&apos;instant</span>}
            {participants.map((m: any) => {
              const s = isSettled(event, participants.length, payments, m.id);
              return (
                <div key={m.id} className="lrow">
                  <div className="av" style={{ width: 38, height: 38, background: '#7c5cff22', border: '1px solid #7c5cff55', fontSize: '1.05rem' }}>
                    {m.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="l-name" style={{ fontSize: '.9rem' }}>
                      {m.name} {m.id === event.organizer_id && <span className="badge">orga</span>}
                    </div>
                  </div>
                  <span className={`badge ${s ? 'paid' : 'due'}`}>{s ? 'payé' : eur(myShare - paidBy(payments, m.id))}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <CagnotteBlock event={event} payments={payments} profById={profById} />
      )}

      <div className="hr" />
      {event.organizer_id === user.id && (
        <form action={deleteEvent.bind(null, event.id, event.group_id)}>
          <button className="btn danger">Supprimer l&apos;événement</button>
        </form>
      )}
    </div>
  );
}

function CagnotteBlock({ event, payments, profById }: { event: EventRow; payments: Payment[]; profById: Record<string, any> }) {
  const c = collected(payments);
  const goal = Number(event.cost) || 0;
  const pct = goal ? Math.min(100, (c / goal) * 100) : 0;
  return (
    <>
      <div className="card">
        <div className="between">
          <span className="muted">Cagnotte récoltée</span>
          <b style={{ fontSize: '1.2rem' }}>{eur(c)}</b>
        </div>
        {goal > 0 && (
          <>
            <div className="progress" style={{ marginTop: 12 }}>
              <i style={{ width: pct + '%' }} />
            </div>
            <div className="muted" style={{ fontSize: '.78rem', marginTop: 6 }}>
              Objectif {eur(goal)} · {Math.round(pct)}%
            </div>
          </>
        )}
        <div style={{ marginTop: 16 }}>
          <ContributeButton eventId={event.id} />
        </div>
      </div>

      <div className="sec-title">
        Participations <span className="count">{payments.length}</span>
      </div>
      <div className="card">
        {payments.length === 0 && <span className="muted">Aucune participation pour l&apos;instant</span>}
        {payments
          .slice()
          .reverse()
          .map((p) => (
            <div key={p.id} className="lrow">
              <div className="av" style={{ width: 38, height: 38, background: '#7c5cff22', border: '1px solid #7c5cff55', fontSize: '1.05rem' }}>
                {profById[p.user_id]?.emoji || '🙂'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="l-name" style={{ fontSize: '.9rem' }}>
                  {profById[p.user_id]?.name || 'Ami'}
                </div>
              </div>
              <span className="amount pos">+{eur(Number(p.amount))}</span>
            </div>
          ))}
      </div>
    </>
  );
}
