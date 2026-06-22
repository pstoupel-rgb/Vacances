import type { EventRow, Payment } from './types';

export const eur = (n: number) =>
  (Math.round(n * 100) / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }) + ' €';

// Part due par participant pour un événement "partage".
export function shareOf(cost: number, participantCount: number) {
  return participantCount ? cost / participantCount : 0;
}

export function paidBy(payments: Payment[], userId: string) {
  return payments
    .filter((p) => p.user_id === userId && p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0);
}

export function collected(payments: Payment[]) {
  return payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
}

export function isSettled(event: EventRow, participantCount: number, payments: Payment[], userId: string) {
  return paidBy(payments, userId) >= shareOf(Number(event.cost), participantCount) - 0.001;
}

// Soldes du groupe : pour chaque événement "partage", l'organisateur avance l'addition ;
// chaque participant lui doit sa part (moins ce qu'il a déjà réglé).
// net > 0 => on lui doit ; net < 0 => il doit.
export function groupBalances(
  events: EventRow[],
  participantsByEvent: Record<string, string[]>,
  paymentsByEvent: Record<string, Payment[]>,
  memberIds: string[]
) {
  const net: Record<string, number> = {};
  memberIds.forEach((id) => (net[id] = 0));
  for (const e of events) {
    if (e.payment_mode !== 'split') continue;
    const parts = participantsByEvent[e.id] || [];
    if (!parts.length) continue;
    const share = shareOf(Number(e.cost), parts.length);
    const pays = paymentsByEvent[e.id] || [];
    for (const uid of parts) {
      const due = share - paidBy(pays, uid);
      if (net[e.organizer_id] !== undefined) net[e.organizer_id] += due;
      if (net[uid] !== undefined) net[uid] -= due;
    }
  }
  return net;
}
