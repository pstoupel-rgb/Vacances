'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { EventType, PaymentMode } from '@/lib/types';

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const emoji = String(formData.get('emoji') || '🎾');
  if (!name) return;
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, emoji, created_by: user.id })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message || 'Création impossible');
  redirect(`/group/${data.id}`);
}

export async function joinGroup(formData: FormData) {
  const { supabase, user } = await requireUser();
  const code = String(formData.get('code') || '').trim().toLowerCase();
  if (!code) return;
  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', code)
    .single();
  if (!group) throw new Error('Code de groupe invalide');
  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
  redirect(`/group/${group.id}`);
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get('group_id'));
  const type = String(formData.get('type') || 'diner') as EventType;
  const title = String(formData.get('title') || '').trim();
  const mode = String(formData.get('payment_mode') || 'split') as PaymentMode;
  const cost = parseFloat(String(formData.get('cost') || '0')) || 0;
  if (!title) return;

  const { data: ev, error } = await supabase
    .from('events')
    .insert({
      group_id: groupId,
      type,
      title,
      event_date: String(formData.get('event_date') || '') || null,
      event_time: String(formData.get('event_time') || '') || null,
      place: String(formData.get('place') || '').trim() || null,
      note: String(formData.get('note') || '').trim() || null,
      organizer_id: user.id,
      payment_mode: mode,
      cost,
    })
    .select('id')
    .single();
  if (error || !ev) throw new Error(error?.message || 'Création impossible');

  // Participants des événements "partage" : sélection + organisateur (toujours inclus).
  if (mode === 'split') {
    const selected = formData.getAll('participant').map((v) => String(v));
    const ids = Array.from(new Set([user.id, ...selected]));
    await supabase
      .from('event_participants')
      .insert(ids.map((uid) => ({ event_id: ev.id, user_id: uid })));
  }
  redirect(`/event/${ev.id}`);
}

export async function joinEvent(eventId: string, groupId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id });
  revalidatePath(`/event/${eventId}`);
}

export async function leaveEvent(eventId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id);
  revalidatePath(`/event/${eventId}`);
}

export async function deleteEvent(eventId: string, groupId: string) {
  const { supabase } = await requireUser();
  await supabase.from('events').delete().eq('id', eventId);
  redirect(`/group/${groupId}`);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get('name') || '').trim();
  const emoji = String(formData.get('emoji') || '😎');
  if (!name) return;
  await supabase.from('profiles').upsert({ id: user.id, name, emoji });
  revalidatePath('/');
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect('/login');
}
