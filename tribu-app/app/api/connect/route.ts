import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Démarre l'onboarding Stripe Connect (Express) pour l'utilisateur courant,
// afin qu'il puisse recevoir les paiements des parts / cagnottes qu'il organise.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Récupère ou crée le compte connecté.
  let accountId: string;
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('account_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.account_id) {
    accountId = existing.account_id;
  } else {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email ?? undefined,
      capabilities: { transfers: { requested: true } },
    });
    accountId = account.id;
    await supabase.from('stripe_accounts').upsert({ user_id: user.id, account_id: accountId, charges_enabled: false });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/?connect=retry`,
    return_url: `${appUrl}/?connect=done`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
