import type { WineItem, WinePick, WinePayment } from './types';

function maps(items: WineItem[]) {
  const price: Record<string, number> = {};
  const bottles: Record<string, number> = {};
  items.forEach((i) => {
    price[i.id] = Number(i.price);
    bottles[i.id] = Number(i.bottles) || 1;
  });
  return { price, bottles };
}

// Total (€) du panier d'un utilisateur.
export function cartTotal(items: WineItem[], picks: WinePick[], userId: string) {
  const { price } = maps(items);
  return picks.filter((p) => p.user_id === userId).reduce((s, p) => s + (price[p.item_id] || 0) * p.quantity, 0);
}

// Nombre de bouteilles du panier d'un utilisateur (quantité de lots × bouteilles par lot).
export function cartBottles(items: WineItem[], picks: WinePick[], userId: string) {
  const { bottles } = maps(items);
  return picks.filter((p) => p.user_id === userId).reduce((s, p) => s + (bottles[p.item_id] || 1) * p.quantity, 0);
}

// Total de bouteilles de toute la commande (tous les amis).
export function totalBottles(items: WineItem[], picks: WinePick[]) {
  const { bottles } = maps(items);
  return picks.reduce((s, p) => s + (bottles[p.item_id] || 1) * p.quantity, 0);
}

// Total (€) de toute la commande.
export function orderTotal(items: WineItem[], picks: WinePick[]) {
  const { price } = maps(items);
  return picks.reduce((s, p) => s + (price[p.item_id] || 0) * p.quantity, 0);
}

export function paidByUser(payments: WinePayment[], userId: string) {
  return payments.filter((p) => p.user_id === userId && p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
}

export function cartSettled(items: WineItem[], picks: WinePick[], payments: WinePayment[], userId: string) {
  const total = cartTotal(items, picks, userId);
  return total > 0 && paidByUser(payments, userId) >= total - 0.001;
}
