import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// Webhook Stripe : confirme les paiements et les enregistre en base.
// IMPORTANT : configurer ce endpoint dans Stripe > Developers > Webhooks
// sur l'événement "checkout.session.completed".
export async function POST(request: NextRequest) {
  const body = await request.text(); // corps brut requis pour vérifier la signature
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return NextResponse.json({ error: `Signature invalide: ${e.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const eventId = session.metadata?.eventId;
    const userId = session.metadata?.userId;
    const amount = (session.amount_total || 0) / 100;

    if (eventId && userId) {
      const admin = createAdminClient(); // service_role : contourne la RLS
      // upsert sur stripe_session_id => idempotent (pas de doublon si Stripe rejoue l'event).
      await admin.from('payments').upsert(
        {
          event_id: eventId,
          user_id: userId,
          amount,
          status: 'paid',
          stripe_session_id: session.id,
        },
        { onConflict: 'stripe_session_id' }
      );
    }
  }

  // Met à jour l'état d'un compte connecté (organisateur) quand Stripe le valide.
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const admin = createAdminClient();
    await admin
      .from('stripe_accounts')
      .update({ charges_enabled: account.charges_enabled ?? false })
      .eq('account_id', account.id);
  }

  return NextResponse.json({ received: true });
}
