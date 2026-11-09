-- ============================================================
-- Akademia — Schéma Supabase & Règles Métier Universitaires
-- À exécuter dans la console Supabase : SQL Editor > New query > Run
-- ============================================================

-- 0) Optionnel : Nettoyage manuel des comptes de test (décommenter uniquement si souhaité)
-- delete from auth.users;

-- 1) Table des profils publics (Classement & Filière)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null check (char_length(username) between 3 and 28),
  filiere     text check (filiere in ('ARI', 'AIP')),
  xp          integer not null default 0,
  level       integer not null default 1,
  streak      integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Si la table existait déjà, s'assurer que la colonne filiere est présente
alter table public.profiles add column if not exists filiere text check (filiere in ('ARI', 'AIP'));

create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_xp_idx on public.profiles (xp desc);
create index if not exists profiles_filiere_idx on public.profiles (filiere);

-- 2) Immutabilité de la filière : impossible de modifier sa filière une fois définie
create or replace function public.check_filiere_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.filiere is not null and new.filiere is distinct from old.filiere then
    raise exception 'La filière ne peut plus être modifiée une fois choisie.';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_profiles_filiere_immutable on public.profiles;
create trigger tr_profiles_filiere_immutable
  before update of filiere on public.profiles
  for each row execute function public.check_filiere_immutable();

-- 3) État complet de progression (privé)
create table if not exists public.user_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- 4) Table des Battles Hebdomadaires (Lundi 00h00 -> Samedi 18h00)
create table if not exists public.battles (
  id           text primary key, -- ex: 'battle-2026-11-02'
  week_label   text not null,    -- ex: 'Semaine du 02/11 au 07/11'
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  ari_score    integer not null default 0,
  aip_score    integer not null default 0,
  ari_members  integer not null default 0,
  aip_members  integer not null default 0,
  winner       text check (winner in ('ARI', 'AIP', 'EGALITE')),
  status       text not null default 'active' check (status in ('active', 'completed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists battles_status_idx on public.battles (status);
create index if not exists battles_ends_at_idx on public.battles (ends_at desc);

-- 5) Vue temps réel des totaux par filière
create or replace view public.filiere_scores as
select
  filiere,
  coalesce(sum(xp), 0)::integer as total_xp,
  count(id)::integer as total_members
from public.profiles
where filiere is not null
group by filiere;

-- 6) Sécurité (Row Level Security)
alter table public.profiles   enable row level security;
alter table public.user_state enable row level security;
alter table public.battles    enable row level security;

-- Politiques profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Politiques user_state
drop policy if exists "state_select_own" on public.user_state;
create policy "state_select_own" on public.user_state for select to authenticated using (auth.uid() = user_id);

drop policy if exists "state_insert_own" on public.user_state;
create policy "state_insert_own" on public.user_state for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "state_update_own" on public.user_state;
create policy "state_update_own" on public.user_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Politiques battles (lecture pour tous, écriture gérée via backend/service role)
drop policy if exists "battles_select" on public.battles;
create policy "battles_select" on public.battles for select to authenticated using (true);

-- Permissions de base pour les rôles authenticated et anon
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_state to authenticated;
grant select on public.battles to anon, authenticated;
grant select on public.filiere_scores to anon, authenticated;

-- 7) Création automatique du profil et de l'état initial à l'inscription avec filière
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  wanted_filiere  text := upper(nullif(trim(new.raw_user_meta_data->>'filiere'), ''));
  final_username  text;
  valid_filiere   text := 'ARI';
  initial_theme   text := 'ciel';
begin
  if wanted_filiere in ('ARI', 'AIP') then
    valid_filiere := wanted_filiere;
  end if;
  if valid_filiere = 'AIP' then
    initial_theme := 'violet';
  end if;

  final_username := coalesce(wanted_username, 'etudiant_' || substr(replace(new.id::text, '-', ''), 1, 6));
  begin
    insert into public.profiles (id, username, filiere)
    values (new.id, final_username, valid_filiere)
    on conflict (id) do update
      set filiere = coalesce(public.profiles.filiere, excluded.filiere);
  exception when unique_violation then
    -- pseudo déjà pris : ajout d'un suffixe unique pour ne jamais bloquer l'inscription
    insert into public.profiles (id, username, filiere)
    values (new.id, left(final_username, 20) || '_' || substr(replace(new.id::text, '-', ''), 1, 5), valid_filiere)
    on conflict (id) do nothing;
  end;

  insert into public.user_state (user_id, state)
  values (
    new.id,
    jsonb_build_object(
      'v', 1,
      'filiere', valid_filiere,
      'theme', initial_theme,
      'xp', 0,
      'streak', 0,
      'bestStreak', 0,
      'lastActive', null,
      'daily', jsonb_build_object('date', to_char(now() at time zone 'utc', 'YYYY-MM-DD'), 'xp', 0),
      'dailyGoal', 50,
      'chaptersRead', '{}'::jsonb,
      'attempts', '[]'::jsonb,
      'badges', '{}'::jsonb,
      'review', '{}'::jsonb,
      'chapterStats', '{}'::jsonb,
      'examBest', '{}'::jsonb,
      'counters', jsonb_build_object('quizzes', 0, 'perfectQuizzes', 0, 'blitzBest', 0, 'maxCombo', 0, 'cardsKnown', 0, 'exams', 0)
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill automatique : garantit qu'aucun compte dans auth.users ne se retrouve sans profil ni filière
insert into public.profiles (id, username, filiere)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'username'), ''), 'etudiant_' || substr(replace(u.id::text, '-', ''), 1, 6)),
  case when upper(trim(u.raw_user_meta_data->>'filiere')) in ('ARI', 'AIP') then upper(trim(u.raw_user_meta_data->>'filiere')) else 'ARI' end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

update public.profiles p
set filiere = coalesce(
  (select case when upper(us.state->>'filiere') in ('ARI', 'AIP') then upper(us.state->>'filiere') else null end from public.user_state us where us.user_id = p.id),
  'ARI'
)
where p.filiere is null or p.filiere not in ('ARI', 'AIP');

-- 5) Messages privés entre deux comptes
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null check (char_length(trim(body)) between 1 and 2000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (sender_id <> recipient_id)
);
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index if not exists messages_recipient_created_idx on public.messages (recipient_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender" on public.messages
  for insert to authenticated
  with check (auth.uid() = sender_id and sender_id <> recipient_id and read_at is null);

drop policy if exists "messages_update_recipient_read" on public.messages;
create policy "messages_update_recipient_read" on public.messages
  for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "messages_delete_participant" on public.messages;
create policy "messages_delete_participant" on public.messages
  for delete to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Suppression personnelle : masquer un message sans effacer la copie de l’autre participant
create table if not exists public.message_deletions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  message_id  uuid not null references public.messages(id) on delete cascade,
  deleted_at  timestamptz not null default now(),
  primary key (user_id, message_id)
);
create index if not exists message_deletions_user_idx on public.message_deletions (user_id, deleted_at desc);
alter table public.message_deletions enable row level security;

drop policy if exists "message_deletions_select_own" on public.message_deletions;
create policy "message_deletions_select_own" on public.message_deletions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "message_deletions_insert_own_participant" on public.message_deletions;
create policy "message_deletions_insert_own_participant" on public.message_deletions
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      where m.id = message_id and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
    )
  );

drop policy if exists "message_deletions_delete_own" on public.message_deletions;
create policy "message_deletions_delete_own" on public.message_deletions
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.message_deletions from anon, authenticated;
grant select, insert, delete on public.message_deletions to authenticated;

create or replace function public.hide_conversation(p_partner_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.message_deletions (user_id, message_id)
  select auth.uid(), m.id
  from public.messages m
  where auth.uid() is not null
    and p_partner_id <> auth.uid()
    and (
      (m.sender_id = auth.uid() and m.recipient_id = p_partner_id)
      or (m.sender_id = p_partner_id and m.recipient_id = auth.uid())
    )
  on conflict (user_id, message_id) do nothing;
$$;
revoke all on function public.hide_conversation(uuid) from public, anon;
grant execute on function public.hide_conversation(uuid) to authenticated;

revoke all on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant delete on public.messages to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

alter table public.messages replica identity full;

-- 6) Abonnements Web Push (gérés uniquement par le backend)
create table if not exists public.push_subscriptions (
  endpoint    text primary key check (endpoint like 'https://%'),
  user_id     uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;

-- 7) Reçus d’actions pour rendre la synchronisation hors ligne idempotente
create table if not exists public.progress_action_receipts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  action_id   uuid not null,
  result      jsonb not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, action_id)
);
alter table public.progress_action_receipts enable row level security;
drop policy if exists "progress_receipts_own" on public.progress_action_receipts;
create policy "progress_receipts_own" on public.progress_action_receipts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
revoke all on public.progress_action_receipts from anon, authenticated;
grant select, insert on public.progress_action_receipts to authenticated;
