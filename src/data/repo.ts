/**
 * Couche de persistance. Deux implémentations interchangeables :
 *  - localRepo    : localStorage (mode invité, aucun compte requis)
 *  - supabaseRepo : Postgres via Supabase (comptes, synchronisation multi-appareils, classement)
 */
import { levelFromXp } from '@/lib/gamification';
import { normalizeState } from '@/lib/progress';
import type { UserState } from '@/lib/types';
import { supabase } from './supabase';

export interface Repo {
  mode: 'local' | 'cloud';
  load(): Promise<UserState | null>;
  save(state: UserState): Promise<void>;
}

export function localRepo(key: string): Repo {
  const k = `akademia:state:${key}`;
  return {
    mode: 'local',
    async load() {
      try {
        const raw = localStorage.getItem(k);
        return raw ? normalizeState(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    },
    async save(state) {
      try {
        localStorage.setItem(k, JSON.stringify(state));
      } catch {
        /* quota ou navigation privée : on ignore */
      }
    },
  };
}

export function supabaseRepo(userId: string): Repo {
  return {
    mode: 'cloud',
    async load() {
      if (!supabase) return null;
      const { data, error } = await supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (!data || !data.state || Object.keys(data.state as object).length === 0) return null;
      return normalizeState(data.state);
    },
    async save(state) {
      if (!supabase) return;
      const now = new Date().toISOString();
      const a = await supabase.from('user_state').upsert({ user_id: userId, state, updated_at: now });
      if (a.error) throw a.error;
      const b = await supabase.from('profiles').update({ xp: state.xp, level: levelFromXp(state.xp), streak: state.streak, updated_at: now }).eq('id', userId);
      if (b.error) throw b.error;
    },
  };
}

export interface LeaderRow {
  id: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
}
export async function fetchLeaderboard(limit = 50): Promise<LeaderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('id, username, xp, level, streak').order('xp', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}
