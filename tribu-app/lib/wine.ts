import type { WineItem, WinePick, WinePayment } from './types';

// Total (€) du panier d'un utilisateur pour une commande.
export function cartTotal(items: WineItem[], picks: WinePick[], userId: string) {
  const priceById: Record<string, number> = {};
  items.forEach((i) => (priceById[i.id] = Number(i.price)));
  return picks
    .filter((p) => p.user_id === userId)
    .reduce((s, p) => s + (priceById[p.item_id] || 0) * p.quantity, 0);
}

// Nombre de bouteilles du panier d'un utilisateur.
export function cartBottles(picks: WinePick[], userId: string) {
  return picks.filter((p) => p.user_id === userId).reduce((s, p) => s + p.quantity, 0);
}

// Total de bouteilles de toute la commande (tous les amis).
export function totalBottles(picks: WinePick[]) {
  return picks.reduce((s, p) => s + p.quantity, 0);
}

// Total (€) de toute la commande.
export function orderTotal(items: WineItem[], picks: WinePick[]) {
  const priceById: Record<string, number> = {};
  items.forEach((i) => (priceById[i.id] = Number(i.price)));
  return picks.reduce((s, p) => s + (priceById[p.item_id] || 0) * p.quantity, 0);
}

export function paidByUser(payments: WinePayment[], userId: string) {
  return payments
    .filter((p) => p.user_id === userId && p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0);
}

// L'utilisateur a-t-il réglé son panier ?
export function cartSettled(items: WineItem[], picks: WinePick[], payments: WinePayment[], userId: string) {
  const total = cartTotal(items, picks, userId);
  return total > 0 && paidByUser(payments, userId) >= total - 0.001;
}
