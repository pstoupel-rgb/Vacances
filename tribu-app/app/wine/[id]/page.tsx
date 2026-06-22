import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { WINE_COLORS, ORDER_CATS, type WineItem, type WinePick, type WinePayment } from '@/lib/types';
import { eur } from '@/lib/money';
import { cartTotal, cartBottles, totalBottles, paidByUser } from '@/lib/wine';
import WineQtyStepper from '@/components/WineQtyStepper';
import WinePayButton from '@/components/WinePayButton';
import AddWineItem from '@/components/AddWineItem';
import { deleteWineOrder, setWineStatus } from '@/app/actions';

export default async function WinePage({ params, searchParams }: { params: { id: string }; searchParams: { paid?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: order } = await supabase.from('wine_orders').select('*').eq('id', params.id).single();
  if (!order) notFound();
  const isOrg = order.organizer_id === user.id;
  const cat = ORDER_CATS[(order.category as keyof typeof ORDER_CATS)] || ORDER_CATS.vin;

  const { data: itemsData } = await supabase.from('wine_items').select('*').eq('order_id', order.id).order('created_at');
  const items = (itemsData || []) as WineItem[];
  const { data: pickData } = await supabase.from('wine_picks').select('*').eq('order_id', order.id);
  const picks = (pickData || []) as WinePick[];
  const { data: payData } = await supabase.from('wine_payments').select('*').eq('order_id', order.id);
  const payments = (payData || []) as WinePayment[];

  const myQty: Record<string, number> = {};
  picks.filter((p) => p.user_id === user.id).forEach((p) => (myQty[p.item_id] = p.quantity));

  const myTotal = cartTotal(items, picks, user.id);
  const myBottles = cartBottles(items, picks, user.id);
  const myPaid = paidByUser(payments, user.id);
  const settled = myTotal > 0 && myPaid >= myTotal - 0.001;
  const allBottles = totalBottles(items, picks);

  // profils des participants
  const userIds = Array.from(new Set(picks.map((p) => p.user_id)));
  const profById: Record<string, any> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from('profiles').select('id, name, emoji').in('id', userIds);
    (profs || []).forEach((p: any) => (profById[p.id] = p));
  }
  const participants = userIds.filter((u) => cartBottles(items, picks, u) > 0);

  return (
    <div>
      <div className="ghead teal">
        <div className="htop">
          <Link href={`/group/${order.group_id}?tab=cmd`} className="back">‹</Link>
          <div style={{ flex: 1 }} />
        </div>
        <div className="center" style={{ marginTop: 6 }}>
          <div style={{ fontSize: '2.6rem' }}>{cat.emoji}</div>
          <h1 style={{ marginTop: 4 }}>{order.title}</h1>
          <span className="badge" style={{ background: 'rgba(255,255,255,.25)', color: '#fff', marginTop: 8, display: 'inline-block' }}>
            {cat.label} · {order.status === 'closed' ? 'Clôturée' : 'ouverte'}
          </span>
        </div>
      </div>

      <div className="wrap">
        {searchParams.paid === '1' && <div className="banner" style={{ color: 'var(--green)', marginBottom: 14 }}>✓ Paiement confirmé, merci !</div>}

        {order.min_bottles > 0 && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="between"><span className="muted" style={{ fontSize: '.85rem' }}>Seuil de la commande</span><b>{allBottles}/{order.min_bottles} {cat.unit}</b></div>
            <div className="progress"><i style={{ width: Math.min(100, (allBottles / order.min_bottles) * 100) + '%', background: 'var(--gtl)' }} /></div>
            <div className="muted" style={{ fontSize: '.76rem', marginTop: 7 }}>
              {allBottles >= order.min_bottles ? '✓ Seuil atteint, la commande peut être validée !' : `Encore ${order.min_bottles - allBottles} ${cat.unit} pour valider.`}
            </div>
          </div>
        )}

        <div className="sec"><h3>Le catalogue</h3></div>
        {items.length === 0 ? (
          <div className="empty"><div className="big">{cat.emoji}</div><h3>Catalogue vide</h3><p>{isOrg ? 'Ajoute des articles à proposer.' : "L'organisateur n'a pas encore ajouté d'articles."}</p></div>
        ) : (
          items.map((p) => {
            const wc = WINE_COLORS[p.color];
            const q = myQty[p.id] || 0;
            const label = order.category === 'vin' && wc ? `${wc.emoji} ${p.name}` : p.name;
            return (
              <div key={p.id} className="wcard">
                <div className="top" style={{ background: cat.grad }}>{cat.emoji}</div>
                <div style={{ padding: '15px 16px' }}>
                  <div className="between"><div style={{ fontWeight: 700, fontSize: '1.02rem' }}>{label}</div><b>{eur(Number(p.price))}</b></div>
                  <div className="muted" style={{ fontSize: '.8rem', marginTop: 3 }}>{p.bottles} {cat.unit}{p.domaine ? ' · ' + p.domaine : ''}</div>
                  <div className="between" style={{ marginTop: 14 }}>
                    {order.status === 'open' ? <WineQtyStepper orderId={order.id} itemId={p.id} initial={q} /> : <span className="badge">{q} commandé{q > 1 ? 's' : ''}</span>}
                    <span className="muted" style={{ fontSize: '.85rem' }}>{q > 0 ? eur(q * Number(p.price)) : ''}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isOrg && order.status === 'open' && <AddWineItem orderId={order.id} category={order.category} unit={cat.unit} />}

        <div className="sec"><h3>Mon panier</h3></div>
        <div className="card">
          <div className="sumrow"><span className="muted">Mes bouteilles</span><b>{myBottles}</b></div>
          <div className="sumrow"><span className="muted">Montant total</span><b>{eur(myTotal)}</b></div>
          <div className="sumrow"><span className="muted">Déjà payé</span><b>{eur(myPaid)}</b></div>
          <div className="sumrow total"><span>Reste à payer</span><span>{eur(Math.max(0, myTotal - myPaid))}</span></div>
          <div style={{ marginTop: 12 }}>
            {settled ? (
              <span className="badge green" style={{ display: 'inline-block' }}>✓ Panier réglé</span>
            ) : (
              <WinePayButton orderId={order.id} amount={Math.round((myTotal - myPaid) * 100) / 100} />
            )}
          </div>
        </div>

        <div className="sec"><h3>Qui commande quoi</h3><span className="muted" style={{ fontSize: '.82rem' }}>{participants.length}</span></div>
        <div className="card">
          {participants.length === 0 && <span className="muted" style={{ fontSize: '.85rem' }}>Aucune sélection pour l&apos;instant</span>}
          {participants.map((u) => (
            <div key={u} className="lrow">
              <div className="av" style={{ width: 38, height: 38, fontSize: '1.05rem' }}>{profById[u]?.emoji || '🙂'}</div>
              <div style={{ flex: 1 }}>
                <div className="l-name">{profById[u]?.name || 'Ami'}</div>
                <div className="l-sub">{cartBottles(items, picks, u)} bouteilles</div>
              </div>
              <span className="amount">{eur(cartTotal(items, picks, u))}</span>
            </div>
          ))}
        </div>

        {isOrg && (
          <>
            <div style={{ height: 12 }} />
            <div className="row">
              <form action={setWineStatus.bind(null, order.id, order.status === 'open' ? 'closed' : 'open')} style={{ flex: 1 }}>
                <button className="btn ghost">{order.status === 'open' ? 'Clôturer la commande' : 'Rouvrir'}</button>
              </form>
              <form action={deleteWineOrder.bind(null, order.id, order.group_id)} style={{ flex: 1 }}>
                <button className="btn danger">Supprimer</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
