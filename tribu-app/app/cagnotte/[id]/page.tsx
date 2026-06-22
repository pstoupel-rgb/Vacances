import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { eur } from '@/lib/money';
import Ring from '@/components/Ring';
import CagnottePayButton from '@/components/CagnottePayButton';
import { deleteCagnotte } from '@/app/actions';
import type { CagnotteContribution } from '@/lib/types';

export default async function CagnottePage({ params, searchParams }: { params: { id: string }; searchParams: { paid?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cag } = await supabase.from('cagnottes').select('*').eq('id', params.id).single();
  if (!cag) notFound();

  const { data: contribData } = await supabase.from('cagnotte_contributions').select('*').eq('cagnotte_id', cag.id);
  const contributions = (contribData || []) as CagnotteContribution[];
  const collected = contributions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0);
  const goal = Number(cag.goal) || 0;
  const pct = goal ? Math.min(100, (collected / goal) * 100) : 0;

  const userIds = Array.from(new Set(contributions.map((c) => c.user_id)));
  const profById: Record<string, any> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, name, emoji').in('id', userIds);
    (profs || []).forEach((p: any) => (profById[p.id] = p));
  }
  // somme par contributeur
  const byUser: Record<string, number> = {};
  contributions.filter((c) => c.status === 'paid').forEach((c) => (byUser[c.user_id] = (byUser[c.user_id] || 0) + Number(c.amount)));
  const rows = Object.entries(byUser).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="ghead orange">
        <div className="htop">
          <Link href={`/group/${cag.group_id}?tab=cagnotte`} className="back">‹</Link>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 700 }} className="ff">{cag.title}</div>
          <div style={{ width: 40 }} />
        </div>
      </div>
      <div className="wrap">
        {searchParams.paid === '1' && <div className="banner" style={{ color: 'var(--green)', marginBottom: 14 }}>✓ Merci pour ta contribution !</div>}

        <div className="card center">
          <div className="ring-wrap" style={{ justifyContent: 'center' }}>
            <Ring pct={pct} />
            <div style={{ textAlign: 'left' }}>
              <div className="muted" style={{ fontSize: '.8rem' }}>Objectif</div>
              <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem' }}>{eur(goal)}</div>
              <div className="muted" style={{ fontSize: '.82rem', marginTop: 6 }}>{eur(collected)} collectés · {rows.length} contributeurs</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}><CagnottePayButton cagnotteId={cag.id} /></div>
        </div>

        <div className="sec"><h3>Contributeurs</h3><span className="muted" style={{ fontSize: '.82rem' }}>{rows.length}</span></div>
        <div className="card">
          {rows.length === 0 && <span className="muted" style={{ fontSize: '.85rem' }}>Aucun contributeur pour l&apos;instant</span>}
          {rows.map(([uid, amt]) => (
            <div key={uid} className="lrow">
              <div className="av" style={{ width: 38, height: 38, fontSize: '1.05rem' }}>{profById[uid]?.emoji || '🙂'}</div>
              <div style={{ flex: 1 }}><div className="l-name">{profById[uid]?.name || 'Ami'}</div></div>
              <span className="amount" style={{ color: 'var(--orange)' }}>{eur(amt)}</span>
            </div>
          ))}
        </div>

        {cag.organizer_id === user.id && (
          <>
            <div style={{ height: 12 }} />
            <form action={deleteCagnotte.bind(null, cag.id, cag.group_id)}>
              <button className="btn danger">Supprimer la cagnotte</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
