import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Crée une session Stripe Checkout pour payer une part (split) ou contribuer à une cagnotte.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const { eventId, amount } = await request.json();
  const cents = Math.round(Number(amount) * 100);
  if (!eventId || !cents || cents < 50) {
    return NextResponse.json({ error: 'Montant invalide (min. 0,50 €)' }, { status: 400 });
  }

  // L'utilisateur doit pouvoir voir l'événement (RLS) => il est membre du groupe.
  const { data: event } = await supabase
    .from('events')
    .select('id, title, organizer_id, payment_mode')
    .eq('id', eventId)
    .single();
  if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Reversement à l'organisateur s'il a connecté un compte Stripe (Connect).
  let transfer: { destination: string } | undefined;
  if (event.organizer_id !== user.id) {
    const { data: acct } = await supabase
      .from('stripe_accounts')
      .select('account_id, charges_enabled')
      .eq('user_id', event.organizer_id)
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
            product_data: { name: `${event.title} — ${event.payment_mode === 'split' ? 'ma part' : 'cagnotte'}` },
          },
        },
      ],
      ...(transfer ? { payment_intent_data: { transfer_data: transfer } } : {}),
      success_url: `${appUrl}/event/${eventId}?paid=1`,
      cancel_url: `${appUrl}/event/${eventId}`,
      metadata: { eventId, userId: user.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur Stripe' }, { status: 500 });
  }
}
