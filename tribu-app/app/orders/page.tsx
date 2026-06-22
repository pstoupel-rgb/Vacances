import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { eur } from '@/lib/money';
import { cartBottles, cartTotal, totalBottles } from '@/lib/wine';
import { ORDER_CATS, type WineItem, type WinePick } from '@/lib/types';

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase.from('group_members').select('group_id, groups(id, name, emoji)');
  const groupById: Record<string, any> = {};
  (memberships || []).forEach((m: any) => m.groups && (groupById[m.groups.id] = m.groups));
  const groupIds = Object.keys(groupById);

  let orders: any[] = [];
  let itemsByOrder: Record<string, WineItem[]> = {};
  let picksByOrder: Record<string, WinePick[]> = {};
  if (groupIds.length) {
    const { data: ord } = await supabase.from('wine_orders').select('*').in('group_id', groupIds).order('created_at', { ascending: false });
    orders = ord || [];
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length) {
      const { data: items } = await supabase.from('wine_items').select('*').in('order_id', orderIds);
      (items || []).forEach((i: any) => (itemsByOrder[i.order_id] ||= []).push(i));
      const { data: picks } = await supabase.from('wine_picks').select('*').in('order_id', orderIds);
      (picks || []).forEach((p: any) => (picksByOrder[p.order_id] ||= []).push(p));
    }
  }

  return (
    <div>
      <div className="ghead teal">
        <div className="htop">
          <Link href="/profile" className="back">‹</Link>
          <div style={{ flex: 1 }}><h1>Mes commandes 🛍️</h1><div className="hsub">Tes commandes groupées</div></div>
        </div>
      </div>
      <div className="wrap">
        {orders.length === 0 ? (
          <div className="empty"><div className="big">🍷</div><h3>Aucune commande</h3><p>Lance une commande de vin depuis un groupe.</p></div>
        ) : (
          orders.map((o) => {
            const items = itemsByOrder[o.id] || [];
            const picks = picksByOrder[o.id] || [];
            const myBottles = cartBottles(items, picks, user.id);
            const myTotal = cartTotal(items, picks, user.id);
            const all = totalBottles(items, picks);
            const st = o.status === 'closed' ? { label: 'Clôturée', cls: 'green' } : { label: 'Ouverte', cls: 'purple' };
            const cat = ORDER_CATS[(o.category as keyof typeof ORDER_CATS)] || ORDER_CATS.vin;
            const g = groupById[o.group_id];
            return (
              <Link key={o.id} href={`/wine/${o.id}`} className="act">
                <div className="thumb" style={{ background: cat.grad }}>{cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="a-title">{o.title}</div>
                  <div className="a-meta">
                    <span>{g?.emoji} {g?.name}</span>
                    {myBottles > 0 && <span>· mon panier : {myBottles} · {eur(myTotal)}</span>}
                  </div>
                  <div className="a-meta" style={{ marginTop: 3 }}>
                    <span>{cat.label} · {all} {cat.unit} au total{o.deadline ? ' · ' + o.deadline : ''}</span>
                  </div>
                </div>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
