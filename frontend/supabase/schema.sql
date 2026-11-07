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
