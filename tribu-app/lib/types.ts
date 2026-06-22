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
