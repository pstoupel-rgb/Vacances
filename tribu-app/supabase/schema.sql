-- ============================================================
--  TRIBU — schéma Supabase (Postgres + RLS)
--  À coller dans Supabase > SQL Editor > Run.
-- ============================================================

-- ---------- Profils (1 par utilisateur auth) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Ami',
  emoji text not null default '😎',
  created_at timestamptz not null default now()
);

-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, emoji)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), '😎')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Groupes ----------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🎾',
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------- Événements ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  type text not null default 'diner',          -- diner | resto | tennis | padel | sortie | autre
  title text not null,
  event_date date,
  event_time text,
  place text,
  note text,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  payment_mode text not null default 'split',  -- split | cagnotte
  cost numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (event_id, user_id)
);

-- ---------- Paiements (alimenté par le webhook Stripe) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'pending',       -- pending | paid
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

-- ---------- Comptes Stripe Connect (pour reverser aux organisateurs) ----------
create table if not exists public.stripe_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id text not null,
  charges_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
--  Fonction d'aide : l'utilisateur courant est-il membre du groupe ?
--  SECURITY DEFINER => évite la récursion RLS sur group_members.
-- ============================================================
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.event_group(eid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select group_id from public.events where id = eid;
$$;

-- ============================================================
--  RLS
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.events              enable row level security;
alter table public.event_participants  enable row level security;
alter table public.payments            enable row level security;
alter table public.stripe_accounts     enable row level security;

-- Profils : chacun lit tous les profils des groupes qu'il partage ; modifie le sien.
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_upsert" on public.profiles;
create policy "profiles_upsert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- Groupes : visibles par leurs membres ; créables par tout utilisateur connecté.
drop policy if exists "groups_read" on public.groups;
create policy "groups_read" on public.groups for select using (public.is_group_member(id) or created_by = auth.uid());
drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups for insert with check (created_by = auth.uid());
drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups for update using (created_by = auth.uid());
drop policy if exists "groups_delete" on public.groups;
create policy "groups_delete" on public.groups for delete using (created_by = auth.uid());

-- Membres : visibles par les membres du groupe ; on peut s'ajouter soi-même (rejoindre).
drop policy if exists "members_read" on public.group_members;
create policy "members_read" on public.group_members for select using (public.is_group_member(group_id));
drop policy if exists "members_join" on public.group_members;
create policy "members_join" on public.group_members for insert with check (user_id = auth.uid());
drop policy if exists "members_leave" on public.group_members;
create policy "members_leave" on public.group_members for delete using (user_id = auth.uid());

-- Événements : visibles/créables par les membres du groupe.
drop policy if exists "events_read" on public.events;
create policy "events_read" on public.events for select using (public.is_group_member(group_id));
drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events for insert with check (public.is_group_member(group_id) and organizer_id = auth.uid());
drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events for update using (organizer_id = auth.uid());
drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events for delete using (organizer_id = auth.uid());

-- Participants : visibles par les membres du groupe ; on s'inscrit/désinscrit soi-même.
drop policy if exists "parts_read" on public.event_participants;
create policy "parts_read" on public.event_participants for select using (public.is_group_member(public.event_group(event_id)));
-- Tout membre du groupe peut ajouter des participants (ex. l'organisateur compose le partage).
drop policy if exists "parts_join" on public.event_participants;
create policy "parts_join" on public.event_participants for insert with check (public.is_group_member(public.event_group(event_id)));
-- On peut se retirer soi-même, ou l'organisateur peut retirer quelqu'un.
drop policy if exists "parts_leave" on public.event_participants;
create policy "parts_leave" on public.event_participants for delete using (
  user_id = auth.uid()
  or auth.uid() = (select organizer_id from public.events where id = event_id)
);

-- Paiements : lecture par les membres du groupe. L'écriture se fait via le webhook (service_role, qui contourne la RLS).
drop policy if exists "payments_read" on public.payments;
create policy "payments_read" on public.payments for select using (public.is_group_member(public.event_group(event_id)));

-- Comptes Stripe : chacun ne voit/écrit que le sien.
drop policy if exists "stripe_self" on public.stripe_accounts;
create policy "stripe_self" on public.stripe_accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
--  Astuce : à la création d'un groupe, ajouter le créateur comme membre.
-- ============================================================
create or replace function public.add_creator_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.add_creator_as_member();

-- ============================================================
--  COMMANDES GROUPÉES DE VIN
-- ============================================================
create table if not exists public.wine_orders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  status text not null default 'open',        -- open | closed
  organizer_id uuid not null references auth.users(id) on delete cascade,
  deadline date,
  min_bottles int not null default 0,          -- seuil minimum de bouteilles
  delivery_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wine_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.wine_orders(id) on delete cascade,
  name text not null,
  domaine text,
  color text not null default 'rouge',         -- rouge | blanc | rose | petillant
  vintage int,                                  -- millésime
  price numeric(10,2) not null default 0,       -- prix par bouteille
  created_at timestamptz not null default now()
);

create table if not exists public.wine_picks (
  order_id uuid not null references public.wine_orders(id) on delete cascade,
  item_id uuid not null references public.wine_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quantity int not null default 0,
  primary key (item_id, user_id)
);

create table if not exists public.wine_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.wine_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'paid',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create or replace function public.order_group(oid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select group_id from public.wine_orders where id = oid;
$$;

alter table public.wine_orders   enable row level security;
alter table public.wine_items    enable row level security;
alter table public.wine_picks    enable row level security;
alter table public.wine_payments enable row level security;

-- Commandes : visibles/créables par les membres du groupe ; gérées par l'organisateur.
drop policy if exists "wo_read" on public.wine_orders;
create policy "wo_read" on public.wine_orders for select using (public.is_group_member(group_id));
drop policy if exists "wo_insert" on public.wine_orders;
create policy "wo_insert" on public.wine_orders for insert with check (public.is_group_member(group_id) and organizer_id = auth.uid());
drop policy if exists "wo_update" on public.wine_orders;
create policy "wo_update" on public.wine_orders for update using (organizer_id = auth.uid());
drop policy if exists "wo_delete" on public.wine_orders;
create policy "wo_delete" on public.wine_orders for delete using (organizer_id = auth.uid());

-- Catalogue : visible par les membres ; édité par l'organisateur de la commande.
drop policy if exists "wi_read" on public.wine_items;
create policy "wi_read" on public.wine_items for select using (public.is_group_member(public.order_group(order_id)));
drop policy if exists "wi_write" on public.wine_items;
create policy "wi_write" on public.wine_items for all
  using (auth.uid() = (select organizer_id from public.wine_orders where id = order_id))
  with check (auth.uid() = (select organizer_id from public.wine_orders where id = order_id));

-- Sélections : visibles par les membres ; chacun gère uniquement les siennes.
drop policy if exists "wp_read" on public.wine_picks;
create policy "wp_read" on public.wine_picks for select using (public.is_group_member(public.order_group(order_id)));
drop policy if exists "wp_write" on public.wine_picks;
create policy "wp_write" on public.wine_picks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_group_member(public.order_group(order_id)));

-- Paiements vin : lecture par les membres ; écriture via webhook (service_role).
drop policy if exists "wpay_read" on public.wine_payments;
create policy "wpay_read" on public.wine_payments for select using (public.is_group_member(public.order_group(order_id)));

-- ============================================================
--  RSVP : statut de participation (Je participe / Peut-être / Non)
-- ============================================================
alter table public.event_participants
  add column if not exists status text not null default 'yes';   -- yes | maybe | no

-- Nombre de bouteilles par lot (ex. "Pack Découverte" = 6 bouteilles)
alter table public.wine_items
  add column if not exists bottles int not null default 1;

-- ============================================================
--  DÎNERS : invitation par email + groupe éphémère/réutilisable
-- ============================================================
alter table public.groups
  add column if not exists ephemeral boolean not null default false;

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists group_invites_email_idx on public.group_invites (lower(email));

alter table public.group_invites enable row level security;
drop policy if exists "gi_read" on public.group_invites;
create policy "gi_read" on public.group_invites for select using (public.is_group_member(group_id));
drop policy if exists "gi_insert" on public.group_invites;
create policy "gi_insert" on public.group_invites for insert with check (public.is_group_member(group_id) and invited_by = auth.uid());
drop policy if exists "gi_delete" on public.group_invites;
create policy "gi_delete" on public.group_invites for delete using (invited_by = auth.uid());

-- À la connexion : l'utilisateur rejoint automatiquement les groupes où son email a été invité.
-- SECURITY DEFINER => contourne la RLS pour lire/écrire les invitations.
create or replace function public.claim_invites()
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id)
    select gi.group_id, auth.uid()
    from public.group_invites gi
    where lower(gi.email) = lower(auth.email()) and gi.accepted = false
  on conflict do nothing;

  update public.group_invites
    set accepted = true
    where lower(email) = lower(auth.email()) and accepted = false;
end; $$;

-- ============================================================
--  SONDAGES
-- ============================================================
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  question text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (poll_id, user_id)
);

create or replace function public.poll_group(pid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select group_id from public.polls where id = pid;
$$;

alter table public.polls        enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes   enable row level security;

drop policy if exists "poll_read" on public.polls;
create policy "poll_read" on public.polls for select using (public.is_group_member(group_id));
drop policy if exists "poll_insert" on public.polls;
create policy "poll_insert" on public.polls for insert with check (public.is_group_member(group_id) and author_id = auth.uid());
drop policy if exists "poll_delete" on public.polls;
create policy "poll_delete" on public.polls for delete using (author_id = auth.uid());

drop policy if exists "popt_read" on public.poll_options;
create policy "popt_read" on public.poll_options for select using (public.is_group_member(public.poll_group(poll_id)));
drop policy if exists "popt_write" on public.poll_options;
create policy "popt_write" on public.poll_options for insert with check (public.is_group_member(public.poll_group(poll_id)));

drop policy if exists "pvote_read" on public.poll_votes;
create policy "pvote_read" on public.poll_votes for select using (public.is_group_member(public.poll_group(poll_id)));
drop policy if exists "pvote_write" on public.poll_votes;
create policy "pvote_write" on public.poll_votes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_group_member(public.poll_group(poll_id)));

-- ============================================================
--  CAGNOTTES (first-class)
-- ============================================================
create table if not exists public.cagnottes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  goal numeric(10,2) not null default 0,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.cagnotte_contributions (
  id uuid primary key default gen_random_uuid(),
  cagnotte_id uuid not null references public.cagnottes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'paid',
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create or replace function public.cagnotte_group(cid uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select group_id from public.cagnottes where id = cid;
$$;

alter table public.cagnottes              enable row level security;
alter table public.cagnotte_contributions enable row level security;

drop policy if exists "cag_read" on public.cagnottes;
create policy "cag_read" on public.cagnottes for select using (public.is_group_member(group_id));
drop policy if exists "cag_insert" on public.cagnottes;
create policy "cag_insert" on public.cagnottes for insert with check (public.is_group_member(group_id) and organizer_id = auth.uid());
drop policy if exists "cag_delete" on public.cagnottes;
create policy "cag_delete" on public.cagnottes for delete using (organizer_id = auth.uid());

drop policy if exists "cagc_read" on public.cagnotte_contributions;
create policy "cagc_read" on public.cagnotte_contributions for select using (public.is_group_member(public.cagnotte_group(cagnotte_id)));

-- ============================================================
--  PHOTOS (galerie par groupe, stockage Supabase Storage)
-- ============================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,                 -- chemin dans le bucket: "<group_id>/<fichier>"
  caption text,
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;
drop policy if exists "photos_read" on public.photos;
create policy "photos_read" on public.photos for select using (public.is_group_member(group_id));
drop policy if exists "photos_insert" on public.photos;
create policy "photos_insert" on public.photos for insert with check (user_id = auth.uid() and public.is_group_member(group_id));
drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete" on public.photos for delete using (user_id = auth.uid());

-- Bucket privé "photos"
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Accès au stockage restreint aux membres du groupe (1er segment du chemin = group_id)
drop policy if exists "photos_obj_select" on storage.objects;
create policy "photos_obj_select" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_group_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "photos_obj_insert" on storage.objects;
create policy "photos_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_group_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "photos_obj_delete" on storage.objects;
create policy "photos_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and owner = auth.uid());
