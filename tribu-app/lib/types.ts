export type EventType = 'diner' | 'resto' | 'tennis' | 'padel' | 'sortie' | 'autre';
export type PaymentMode = 'split' | 'cagnotte';

export const TYPES: Record<EventType, { label: string; emoji: string; color: string }> = {
  diner:  { label: 'Dîner',  emoji: '🍽️', color: '#f59e0b' },
  resto:  { label: 'Resto',  emoji: '🍷', color: '#fb7185' },
  tennis: { label: 'Tennis', emoji: '🎾', color: '#84cc16' },
  padel:  { label: 'Padel',  emoji: '🏓', color: '#22d3ee' },
  sortie: { label: 'Sortie', emoji: '🎉', color: '#a855f7' },
  autre:  { label: 'Autre',  emoji: '📌', color: '#94a3b8' },
};

export interface Profile { id: string; name: string; emoji: string; }
export interface Group {
  id: string; name: string; emoji: string; invite_code: string;
  created_by: string; created_at: string;
}
export interface EventRow {
  id: string; group_id: string; type: EventType; title: string;
  event_date: string | null; event_time: string | null; place: string | null; note: string | null;
  organizer_id: string; payment_mode: PaymentMode; cost: number; created_at: string;
}
export interface Payment {
  id: string; event_id: string; user_id: string; amount: number;
  status: string; stripe_session_id: string | null; created_at: string;
}

export type WineColor = 'rouge' | 'blanc' | 'rose' | 'petillant';
export const WINE_COLORS: Record<WineColor, { label: string; emoji: string; color: string }> = {
  rouge:     { label: 'Rouge',     emoji: '🍷', color: '#b91c1c' },
  blanc:     { label: 'Blanc',     emoji: '🥂', color: '#ca8a04' },
  rose:      { label: 'Rosé',      emoji: '🌸', color: '#ec4899' },
  petillant: { label: 'Pétillant', emoji: '🍾', color: '#0ea5e9' },
};

export interface WineOrder {
  id: string; group_id: string; title: string; status: 'open' | 'closed';
  organizer_id: string; deadline: string | null; min_bottles: number;
  delivery_note: string | null; created_at: string;
}
export interface WineItem {
  id: string; order_id: string; name: string; domaine: string | null;
  color: WineColor; vintage: number | null; price: number; bottles: number; created_at: string;
}
export interface WinePick {
  order_id: string; item_id: string; user_id: string; quantity: number;
}
export interface WinePayment {
  id: string; order_id: string; user_id: string; amount: number;
  status: string; stripe_session_id: string | null; created_at: string;
}

export interface Poll { id: string; group_id: string; question: string; author_id: string; created_at: string; }
export interface PollOption { id: string; poll_id: string; label: string; }
export interface PollVote { poll_id: string; option_id: string; user_id: string; }

export interface Cagnotte { id: string; group_id: string; title: string; goal: number; organizer_id: string; created_at: string; }
export interface CagnotteContribution {
  id: string; cagnotte_id: string; user_id: string; amount: number;
  status: string; stripe_session_id: string | null; created_at: string;
}
