import type { EventRow, Payment, Settlement } from './types';

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
  memberIds: string[],
  settlements: Settlement[] = []
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
  // Remboursements déjà effectués : le débiteur réduit sa dette, le créancier ce qu'on lui doit.
  for (const s of settlements) {
    if (s.status !== 'paid') continue;
    if (net[s.from_user] !== undefined) net[s.from_user] += Number(s.amount);
    if (net[s.to_user] !== undefined) net[s.to_user] -= Number(s.amount);
  }
  return net;
}

// Transferts minimaux pour équilibrer le groupe : qui paie qui, et combien.
export function computeTransfers(net: Record<string, number>) {
  const debtors: { id: string; amt: number }[] = [];
  const creditors: { id: string; amt: number }[] = [];
  Object.entries(net).forEach(([id, v]) => {
    if (v < -0.01) debtors.push({ id, amt: -v });
    else if (v > 0.01) creditors.push({ id, amt: v });
  });
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0.01) transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(pay * 100) / 100 });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.01) i++;
    if (creditors[j].amt < 0.01) j++;
  }
  return transfers;
}
