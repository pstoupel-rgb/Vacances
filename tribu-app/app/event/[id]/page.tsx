import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TYPES, type EventRow, type Payment } from '@/lib/types';
import { eur, shareOf, paidBy, isSettled, collected } from '@/lib/money';
import PayButton from '@/components/PayButton';
import ContributeButton from '@/components/ContributeButton';
import RsvpButtons from '@/components/RsvpButtons';
import AddToCalendar from '@/components/AddToCalendar';
import { deleteEvent } from '@/app/actions';

export default async function EventPage({ params, searchParams }: { params: { id: string }; searchParams: { paid?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: e } = await supabase.from('events').select('*').eq('id', params.id).single();
  if (!e) notFound();
  const event = e as EventRow;
  const t = TYPES[event.type];

  const { data: partRows } = await supabase
    .from('event_participants')
    .select('user_id, status, profiles(id, name, emoji)')
    .eq('event_id', event.id);
  const all = (partRows || []).map((p: any) => ({ id: p.user_id, status: p.status, ...p.profiles }));
  const yes = all.filter((p) => p.status === 'yes');
  const count = (s: string) => all.filter((p) => p.status === s).length;
  const myStatus = all.find((p) => p.id === user.id)?.status as 'yes' | 'maybe' | 'no' | undefined;

  const { data: payRows } = await supabase.from('payments').select('*').eq('event_id', event.id);
  const payments = (payRows || []) as Payment[];
  const profById: Record<string, any> = {};
  all.forEach((p: any) => (profById[p.id] = p));
  const missing = payments.map((p) => p.user_id).filter((id) => !profById[id]);
  if (missing.length) {
    const { data: extra } = await supabase.from('profiles').select('id, name, emoji').in('id', missing);
    (extra || []).forEach((p: any) => (profById[p.id] = p));
  }

  const { data: orgProfile } = await supabase.from('profiles').select('name').eq('id', event.organizer_id).single();

  const share = shareOf(Number(event.cost), yes.length);
  const myPaid = paidBy(payments, user.id);
  const settled = myPaid >= share - 0.001 && share > 0;

  return (
    <div>
      <div className="hero-act" style={{ borderRadius: '0 0 26px 26px' }}>
        <div className="img" style={{ height: 190, background: t.color, paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}>
          <Link href={`/group/${event.group_id}`} className="back">‹</Link>
        </div>
        <div className="pad" style={{ padding: '16px 18px' }}>
          <span className="pill">{t.emoji} {t.label}{orgProfile ? ' · ' + (orgProfile.name || '').split(' ')[0] : ''}</span>
          <h1 style={{ fontSize: '1.4rem', marginTop: 10 }}>{event.title}</h1>
          <div className="a-meta" style={{ marginTop: 8, fontSize: '.85rem' }}>
            {event.event_date && <span>📅 {event.event_date}{event.event_time ? ' · ' + event.event_time : ''}</span>}
            {event.place && <span>📍 {event.place}</span>}
          </div>
          {event.note && <div className="muted" style={{ fontSize: '.85rem', marginTop: 8, lineHeight: 1.5 }}>{event.note}</div>}
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 14 }}>
        {searchParams.paid === '1' && <div className="banner" style={{ color: 'var(--green)', marginBottom: 14 }}>✓ Paiement confirmé, merci !</div>}

        <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
          {event.place && (
            <a className="btn ghost small" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.place)}`} target="_blank" rel="noreferrer">
              🧭 Y aller
            </a>
          )}
          <AddToCalendar title={event.title} date={event.event_date} time={event.event_time} place={event.place} />
        </div>

        <RsvpButtons eventId={event.id} current={myStatus} />

        <div className="stats" style={{ marginTop: 14 }}>
          <div className="st"><b>{all.length}</b><span>réponses</span></div>
          <div className="st"><b>{count('yes')}</b><span>oui</span></div>
          <div className="st"><b>{count('maybe')}</b><span>peut-être</span></div>
          <div className="st"><b>{count('no')}</b><span>non</span></div>
        </div>

        {event.payment_mode === 'split' ? (
          Number(event.cost) > 0 && (
            <>
              <div className="sec"><h3>Paiement</h3></div>
              <div className="card">
                <div className="sumrow"><span className="muted">Montant total estimé</span><b>{eur(Number(event.cost))}</b></div>
                <div className="sumrow"><span className="muted">Ma part ({yes.length} participants)</span><b>{eur(share)}</b></div>
                <div style={{ marginTop: 12 }}>
                  {myStatus === 'yes' ? (
                    settled ? (
                      <span className="badge green" style={{ display: 'inline-block' }}>✓ Ta part est réglée</span>
                    ) : (
                      <PayButton eventId={event.id} amount={Math.round((share - myPaid) * 100) / 100} label="Payer ma part" />
                    )
                  ) : (
                    <div className="muted" style={{ fontSize: '.82rem' }}>Indique « Je participe » pour régler ta part.</div>
                  )}
                </div>
              </div>
            </>
          )
        ) : (
          <>
            <div className="sec"><h3>Cagnotte</h3></div>
            <div className="card">
              <div className="between"><span className="muted">Récolté</span><b style={{ fontSize: '1.1rem' }}>{eur(collected(payments))}{Number(event.cost) ? ' / ' + eur(Number(event.cost)) : ''}</b></div>
              {Number(event.cost) > 0 && <div className="progress"><i style={{ width: Math.min(100, (collected(payments) / Number(event.cost)) * 100) + '%' }} /></div>}
              <div style={{ marginTop: 14 }}><ContributeButton eventId={event.id} /></div>
            </div>
          </>
        )}

        <div className="sec"><h3>Participants</h3><span className="muted" style={{ fontSize: '.82rem' }}>{yes.length}</span></div>
        <div className="card">
          {yes.length === 0 && <span className="muted" style={{ fontSize: '.85rem' }}>Personne pour l&apos;instant</span>}
          {yes.map((m: any) => {
            const s = isSettled(event, yes.length, payments, m.id);
            return (
              <div key={m.id} className="lrow">
                <div className="av" style={{ width: 38, height: 38, fontSize: '1.05rem' }}>{m.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="l-name">{m.name} {m.id === event.organizer_id && <span className="badge purple">orga</span>}</div>
                </div>
                {event.payment_mode === 'split' && Number(event.cost) > 0 && (
                  <span className={`badge ${s ? 'green' : 'red'}`}>{s ? 'payé' : eur(share - paidBy(payments, m.id))}</span>
                )}
              </div>
            );
          })}
        </div>

        {event.organizer_id === user.id && (
          <>
            <div style={{ height: 12 }} />
            <form action={deleteEvent.bind(null, event.id, event.group_id)}>
              <button className="btn danger">Supprimer l&apos;activité</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
