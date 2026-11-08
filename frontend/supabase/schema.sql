-- ============================================================
-- Akademia — schéma Supabase
-- À exécuter une fois : Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) Profils publics (classement)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null check (char_length(username) between 3 and 24),
  xp          integer not null default 0,
  level       integer not null default 1,
  streak      integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_xp_idx on public.profiles (xp desc);

-- 2) État complet de progression (privé)
create table if not exists public.user_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- 3) Sécurité (Row Level Security)
alter table public.profiles   enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "state_select_own" on public.user_state;
create policy "state_select_own" on public.user_state for select to authenticated using (auth.uid() = user_id);

drop policy if exists "state_insert_own" on public.user_state;
create policy "state_insert_own" on public.user_state for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "state_update_own" on public.user_state;
create policy "state_update_own" on public.user_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  final  text;
begin
  final := coalesce(wanted, 'joueur' || substr(replace(new.id::text, '-', ''), 1, 6));
  begin
    insert into public.profiles (id, username) values (new.id, final);
  exception when unique_violation then
    -- pseudo déjà pris : on ajoute un suffixe pour ne jamais bloquer l'inscription
    insert into public.profiles (id, username)
    values (new.id, left(final, 17) || '_' || substr(replace(new.id::text, '-', ''), 1, 5));
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
