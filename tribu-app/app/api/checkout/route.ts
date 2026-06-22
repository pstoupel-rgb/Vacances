import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Crée une session Stripe Checkout pour :
//  - payer une part / une cagnotte (body: { eventId, amount })
//  - payer son panier de vin       (body: { orderId, amount })
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { eventId, orderId, cagnotteId, settleToUser, groupId: settleGroupId, amount } = await request.json();
  const cents = Math.round(Number(amount) * 100);
  if ((!eventId && !orderId && !cagnotteId && !settleToUser) || !cents || cents < 50) {
    return NextResponse.json({ error: 'Montant invalide (min. 0,50 €)' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  let label = '';
  let organizerId = '';
  let successPath = '';
  const metadata: Record<string, string> = { userId: user.id };

  if (settleToUser) {
    // Remboursement direct à un ami.
    const { data: creditor } = await supabase.from('profiles').select('name').eq('id', settleToUser).single();
    label = `Remboursement à ${creditor?.name || 'un ami'}`;
    organizerId = settleToUser; // l'argent va au créancier
    successPath = `/group/${settleGroupId}?tab=membres`;
    metadata.kind = 'settle';
    metadata.groupId = settleGroupId;
    metadata.toUser = settleToUser;
  } else if (cagnotteId) {
    const { data: cag } = await supabase
      .from('cagnottes')
      .select('id, title, organizer_id')
      .eq('id', cagnotteId)
      .single();
    if (!cag) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 });
    label = `${cag.title} — cagnotte`;
    organizerId = cag.organizer_id;
    successPath = `/cagnotte/${cagnotteId}`;
    metadata.kind = 'cagnotte';
    metadata.cagnotteId = cagnotteId;
  } else if (orderId) {
    const { data: order } = await supabase
      .from('wine_orders')
      .select('id, title, organizer_id')
      .eq('id', orderId)
      .single();
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    label = `${order.title} — vin`;
    organizerId = order.organizer_id;
    successPath = `/wine/${orderId}`;
    metadata.kind = 'wine';
    metadata.orderId = orderId;
  } else {
    const { data: event } = await supabase
      .from('events')
      .select('id, title, organizer_id, payment_mode')
      .eq('id', eventId)
      .single();
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
    label = `${event.title} — ${event.payment_mode === 'split' ? 'ma part' : 'cagnotte'}`;
    organizerId = event.organizer_id;
    successPath = `/event/${eventId}`;
    metadata.kind = 'event';
    metadata.eventId = eventId;
  }

  // Reversement à l'organisateur s'il a connecté un compte Stripe (Connect).
  let transfer: { destination: string } | undefined;
  if (organizerId !== user.id) {
    const { data: acct } = await supabase
      .from('stripe_accounts')
      .select('account_id, charges_enabled')
      .eq('user_id', organizerId)
      .maybeSingle();
    if (acct?.charges_enabled) transfer = { destination: acct.account_id };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: cents,
            product_data: { name: label },
          },
        },
      ],
      ...(transfer ? { payment_intent_data: { transfer_data: transfer } } : {}),
      success_url: `${appUrl}${successPath}?paid=1`,
      cancel_url: `${appUrl}${successPath}`,
      metadata,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur Stripe' }, { status: 500 });
  }
}
