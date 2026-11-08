-- ============================================================
-- Akademia — Schéma Supabase & Règles Métier Universitaires
-- À exécuter dans la console Supabase : SQL Editor > New query > Run
-- ============================================================

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

-- 7) Création automatique du profil à l'inscription avec filière
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  wanted_filiere  text := upper(nullif(trim(new.raw_user_meta_data->>'filiere'), ''));
  final_username  text;
  valid_filiere   text := null;
begin
  if wanted_filiere in ('ARI', 'AIP') then
    valid_filiere := wanted_filiere;
  end if;

  final_username := coalesce(wanted_username, 'etudiant_' || substr(replace(new.id::text, '-', ''), 1, 6));
  begin
    insert into public.profiles (id, username, filiere)
    values (new.id, final_username, valid_filiere);
  exception when unique_violation then
    -- pseudo déjà pris : ajout d'un suffixe unique pour ne jamais bloquer l'inscription
    insert into public.profiles (id, username, filiere)
    values (new.id, left(final_username, 20) || '_' || substr(replace(new.id::text, '-', ''), 1, 5), valid_filiere);
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
