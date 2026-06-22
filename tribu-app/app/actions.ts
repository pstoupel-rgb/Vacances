'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { sendInviteEmails } from '@/lib/email';
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

// Flux « dîner » : on invite des gens par email, et le groupe est créé au moment où on valide.
export async function createDinner(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get('title') || '').trim();
  if (!title) return;
  const ephemeral = String(formData.get('ephemeral') || '') === 'on';
  const groupName = String(formData.get('group_name') || '').trim() || `Dîner — ${title}`;

  // 1) le groupe se crée
  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: groupName, emoji: '🍝', created_by: user.id, ephemeral })
    .select('id')
    .single();
  if (gErr || !group) throw new Error(gErr?.message || 'Création du groupe impossible');

  // 2) le dîner
  const cost = parseFloat(String(formData.get('cost') || '0')) || 0;
  const { data: ev, error: eErr } = await supabase
    .from('events')
    .insert({
      group_id: group.id,
      type: 'diner',
      title,
      event_date: String(formData.get('event_date') || '') || null,
      event_time: String(formData.get('event_time') || '') || null,
      place: String(formData.get('place') || '').trim() || null,
      note: String(formData.get('note') || '').trim() || null,
      organizer_id: user.id,
      payment_mode: 'split',
      cost,
    })
    .select('id')
    .single();
  if (eErr || !ev) throw new Error(eErr?.message || 'Création du dîner impossible');
  await supabase.from('event_participants').insert({ event_id: ev.id, user_id: user.id, status: 'yes' });

  // 3) invitations individuelles par email
  const emails = Array.from(
    new Set(
      formData
        .getAll('email')
        .map((v) => String(v).trim().toLowerCase())
        .filter((e) => e && e.includes('@') && e !== (user.email || '').toLowerCase())
    )
  );
  if (emails.length) {
    await supabase.from('group_invites').insert(emails.map((email) => ({ group_id: group.id, email, invited_by: user.id })));
    const { data: me } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    await sendInviteEmails(emails, { inviterName: me?.name || 'Un ami', groupName, eventTitle: title });
  }

  redirect(`/event/${ev.id}`);
}

// À appeler à l'ouverture de l'app : rejoint les groupes où l'utilisateur a été invité par email.
export async function claimInvites() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('claim_invites');
}

export async function joinEvent(eventId: string, groupId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id });
  revalidatePath(`/event/${eventId}`);
}

// RSVP : Je participe (yes) / Peut-être (maybe) / Non (no).
export async function setRsvp(eventId: string, status: 'yes' | 'maybe' | 'no') {
  const { supabase, user } = await requireUser();
  await supabase
    .from('event_participants')
    .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
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

/* ----------------------- Commandes de vin ----------------------- */

export async function createWineOrder(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get('group_id'));
  const title = String(formData.get('title') || '').trim();
  const minBottles = parseInt(String(formData.get('min_bottles') || '0')) || 0;
  if (!title) return;
  const { data, error } = await supabase
    .from('wine_orders')
    .insert({
      group_id: groupId,
      title,
      organizer_id: user.id,
      min_bottles: minBottles,
      deadline: String(formData.get('deadline') || '') || null,
      delivery_note: String(formData.get('delivery_note') || '').trim() || null,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message || 'Création impossible');
  redirect(`/wine/${data.id}`);
}

export async function addWineItem(formData: FormData) {
  const { supabase } = await requireUser();
  const orderId = String(formData.get('order_id'));
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  await supabase.from('wine_items').insert({
    order_id: orderId,
    name,
    domaine: String(formData.get('domaine') || '').trim() || null,
    color: String(formData.get('color') || 'rouge'),
    bottles: parseInt(String(formData.get('bottles') || '1')) || 1,
    price: parseFloat(String(formData.get('price') || '0')) || 0,
  });
  revalidatePath(`/wine/${orderId}`);
}

export async function deleteWineItem(itemId: string, orderId: string) {
  const { supabase } = await requireUser();
  await supabase.from('wine_items').delete().eq('id', itemId);
  revalidatePath(`/wine/${orderId}`);
}

export async function setWinePick(orderId: string, itemId: string, quantity: number) {
  const { supabase, user } = await requireUser();
  const q = Math.max(0, Math.floor(quantity));
  if (q === 0) {
    await supabase.from('wine_picks').delete().eq('item_id', itemId).eq('user_id', user.id);
  } else {
    await supabase
      .from('wine_picks')
      .upsert(
        { order_id: orderId, item_id: itemId, user_id: user.id, quantity: q },
        { onConflict: 'item_id,user_id' }
      );
  }
  revalidatePath(`/wine/${orderId}`);
}

export async function setWineStatus(orderId: string, status: 'open' | 'closed') {
  const { supabase } = await requireUser();
  await supabase.from('wine_orders').update({ status }).eq('id', orderId);
  revalidatePath(`/wine/${orderId}`);
}

export async function deleteWineOrder(orderId: string, groupId: string) {
  const { supabase } = await requireUser();
  await supabase.from('wine_orders').delete().eq('id', orderId);
  redirect(`/group/${groupId}?tab=cmd`);
}

/* ----------------------- Sondages ----------------------- */

export async function createPoll(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get('group_id'));
  const question = String(formData.get('question') || '').trim();
  const options = formData.getAll('option').map((v) => String(v).trim()).filter(Boolean);
  if (!question || options.length < 2) return;
  const { data: poll, error } = await supabase
    .from('polls')
    .insert({ group_id: groupId, question, author_id: user.id })
    .select('id')
    .single();
  if (error || !poll) throw new Error(error?.message || 'Création impossible');
  await supabase.from('poll_options').insert(options.map((label) => ({ poll_id: poll.id, label })));
  redirect(`/poll/${poll.id}`);
}

export async function votePoll(pollId: string, optionId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('poll_votes').upsert({ poll_id: pollId, option_id: optionId, user_id: user.id }, { onConflict: 'poll_id,user_id' });
  revalidatePath(`/poll/${pollId}`);
}

export async function addPollOption(pollId: string, label: string) {
  const { supabase } = await requireUser();
  const v = label.trim();
  if (!v) return;
  await supabase.from('poll_options').insert({ poll_id: pollId, label: v });
  revalidatePath(`/poll/${pollId}`);
}

export async function deletePoll(pollId: string, groupId: string) {
  const { supabase } = await requireUser();
  await supabase.from('polls').delete().eq('id', pollId);
  redirect(`/group/${groupId}?tab=acts`);
}

/* ----------------------- Cagnottes ----------------------- */

export async function createCagnotte(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = String(formData.get('group_id'));
  const title = String(formData.get('title') || '').trim();
  const goal = parseFloat(String(formData.get('goal') || '0')) || 0;
  if (!title) return;
  const { data, error } = await supabase
    .from('cagnottes')
    .insert({ group_id: groupId, title, goal, organizer_id: user.id })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message || 'Création impossible');
  redirect(`/cagnotte/${data.id}`);
}

export async function deleteCagnotte(cagnotteId: string, groupId: string) {
  const { supabase } = await requireUser();
  await supabase.from('cagnottes').delete().eq('id', cagnotteId);
  redirect(`/group/${groupId}?tab=cagnotte`);
}

/* ----------------------- Photos ----------------------- */

// Enregistre la ligne photo après l'upload du fichier dans le storage (fait côté client).
export async function addPhoto(groupId: string, path: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('photos').insert({ group_id: groupId, user_id: user.id, path });
  revalidatePath(`/group/${groupId}`);
}

export async function deletePhoto(photoId: string, path: string, groupId: string) {
  const { supabase } = await requireUser();
  await supabase.storage.from('photos').remove([path]);
  await supabase.from('photos').delete().eq('id', photoId);
  revalidatePath(`/group/${groupId}`);
}
