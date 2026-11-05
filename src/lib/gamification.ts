/**
 * Règles du jeu d'Akademia : XP (« puissance »), niveaux, paliers, badges.
 * Tout est centralisé ici pour pouvoir équilibrer le jeu facilement.
 */
import type { ModuleMeta, UserState } from './types';

// ---------- Niveaux ----------
export const levelFromXp = (xp: number) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 40));
export const xpForLevel = (level: number) => 40 * (level - 1) * (level - 1);
export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const a = xpForLevel(level);
  const b = xpForLevel(level + 1);
  return { level, current: xp - a, needed: b - a, ratio: (xp - a) / (b - a) };
}

// ---------- Paliers de puissance ----------
export interface Tier {
  min: number;
  name: string;
  emoji: string;
  color: string;
}
export const TIERS: Tier[] = [
  { min: 1, name: 'Étincelle', emoji: '✨', color: '#F59E0B' },
  { min: 3, name: 'Pile', emoji: '🔋', color: '#10B981' },
  { min: 5, name: 'Ampoule', emoji: '💡', color: '#EAB308' },
  { min: 8, name: 'Moteur', emoji: '⚙️', color: '#3B82F6' },
  { min: 11, name: 'Turbine', emoji: '🌀', color: '#06B6D4' },
  { min: 15, name: 'Centrale', emoji: '🏭', color: '#8B5CF6' },
  { min: 20, name: 'Fusion', emoji: '⚛️', color: '#EC4899' },
  { min: 26, name: 'Soleil', emoji: '☀️', color: '#F97316' },
];
export function tierFor(level: number): Tier {
  let t = TIERS[0];
  for (const x of TIERS) if (level >= x.min) t = x;
  return t;
}
export function nextTier(level: number): Tier | undefined {
  return TIERS.find((t) => t.min > level);
}

// ---------- Récompenses ----------
export const XP = {
  chapterRead: 25,
  perfectQuiz: 30,
  goodQuiz: 15, // >= 80 %
  badge: 20,
  cardKnown: 2,
  cardCap: 40,
  dailyGoal: 50,
  dailyBonus: 20,
  base: { 1: 10, 2: 15, 3: 20 } as Record<number, number>,
};
export const comboMultiplier = (combo: number) => 1 + Math.min(Math.max(combo - 1, 0), 4) * 0.25; // x1 à x2
export const speedBonus = (seconds: number) => (seconds < 6 ? 3 : 0);

export function mention(score: number, max: number): { label: string; emoji: string } {
  const r = max ? (score / max) * 20 : 0;
  if (r >= 16) return { label: 'Très bien', emoji: '🏆' };
  if (r >= 14) return { label: 'Bien', emoji: '🎯' };
  if (r >= 12) return { label: 'Assez bien', emoji: '👍' };
  if (r >= 10) return { label: 'Passable', emoji: '🙂' };
  return { label: 'À retravailler', emoji: '💪' };
}

// ---------- Badges ----------
export type Rarity = 'commun' | 'rare' | 'épique' | 'légendaire';
export interface Ctx {
  modules: ModuleMeta[];
}
export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  rarity: Rarity;
  check: (s: UserState, c: Ctx) => boolean;
  progress?: (s: UserState, c: Ctx) => { cur: number; max: number };
}

const totalRead = (s: UserState) => Object.values(s.chaptersRead).reduce((a, b) => a + b.length, 0);
const bestExamRatio = (s: UserState) => Object.values(s.examBest).reduce((m, e) => Math.max(m, e.max ? e.score / e.max : 0), 0);
const prog = (cur: number, max: number) => ({ cur: Math.min(cur, max), max });

export const BADGES: BadgeDef[] = [
  { id: 'first-step', name: 'Premier pas', desc: 'Terminer une première activité.', emoji: '👣', rarity: 'commun', check: (s) => s.attempts.length >= 1 },
  { id: 'reader-1', name: 'Curieux', desc: 'Terminer la lecture d’un chapitre.', emoji: '📖', rarity: 'commun', check: (s) => totalRead(s) >= 1 },
  { id: 'reader-5', name: 'Lecteur assidu', desc: 'Terminer 5 chapitres.', emoji: '📚', rarity: 'rare', check: (s) => totalRead(s) >= 5, progress: (s) => prog(totalRead(s), 5) },
  {
    id: 'reader-all', name: 'Rat de bibliothèque', desc: 'Terminer tous les chapitres d’un module.', emoji: '🦉', rarity: 'épique',
    check: (s, c) => c.modules.some((m) => m.chapters.length > 0 && (s.chaptersRead[m.id]?.length ?? 0) >= m.chapters.length),
  },
  { id: 'quiz-5', name: 'Quizzeur', desc: 'Terminer 5 QCM.', emoji: '🎮', rarity: 'commun', check: (s) => s.counters.quizzes >= 5, progress: (s) => prog(s.counters.quizzes, 5) },
  { id: 'quiz-25', name: 'Accro au QCM', desc: 'Terminer 25 QCM.', emoji: '🕹️', rarity: 'rare', check: (s) => s.counters.quizzes >= 25, progress: (s) => prog(s.counters.quizzes, 25) },
  { id: 'perfect-1', name: 'Sans faute', desc: 'Réussir un QCM à 100 %.', emoji: '💯', rarity: 'rare', check: (s) => s.counters.perfectQuizzes >= 1 },
  { id: 'perfect-5', name: 'Perfectionniste', desc: 'Réussir 5 QCM à 100 %.', emoji: '💎', rarity: 'épique', check: (s) => s.counters.perfectQuizzes >= 5, progress: (s) => prog(s.counters.perfectQuizzes, 5) },
  { id: 'combo-5', name: 'Combo x5', desc: 'Enchaîner 5 bonnes réponses.', emoji: '🔥', rarity: 'commun', check: (s) => s.counters.maxCombo >= 5, progress: (s) => prog(s.counters.maxCombo, 5) },
  { id: 'combo-10', name: 'Inarrêtable', desc: 'Enchaîner 10 bonnes réponses.', emoji: '🚀', rarity: 'rare', check: (s) => s.counters.maxCombo >= 10, progress: (s) => prog(s.counters.maxCombo, 10) },
  { id: 'combo-20', name: 'Surcharge', desc: 'Enchaîner 20 bonnes réponses.', emoji: '⚡', rarity: 'légendaire', check: (s) => s.counters.maxCombo >= 20, progress: (s) => prog(s.counters.maxCombo, 20) },
  { id: 'blitz-10', name: 'Éclair', desc: '10 bonnes réponses dans un défi éclair.', emoji: '⏱️', rarity: 'rare', check: (s) => s.counters.blitzBest >= 10, progress: (s) => prog(s.counters.blitzBest, 10) },
  { id: 'blitz-20', name: 'Foudre', desc: '20 bonnes réponses dans un défi éclair.', emoji: '🌩️', rarity: 'épique', check: (s) => s.counters.blitzBest >= 20, progress: (s) => prog(s.counters.blitzBest, 20) },
  { id: 'exam-1', name: 'Candidat', desc: 'Terminer une épreuve complète.', emoji: '📝', rarity: 'commun', check: (s) => s.counters.exams >= 1 },
  { id: 'exam-5', name: 'Habitué des examens', desc: 'Terminer 5 épreuves complètes.', emoji: '🎓', rarity: 'rare', check: (s) => s.counters.exams >= 5, progress: (s) => prog(s.counters.exams, 5) },
  { id: 'exam-14', name: 'Mention Bien', desc: 'Obtenir 14/20 ou plus à une épreuve.', emoji: '🥈', rarity: 'rare', check: (s) => bestExamRatio(s) >= 0.7 },
  { id: 'exam-16', name: 'Mention Très Bien', desc: 'Obtenir 16/20 ou plus à une épreuve.', emoji: '🥇', rarity: 'épique', check: (s) => bestExamRatio(s) >= 0.8 },
  { id: 'cards-50', name: 'Mémoire d’éléphant', desc: 'Retenir 50 cartes mémoire.', emoji: '🐘', rarity: 'rare', check: (s) => s.counters.cardsKnown >= 50, progress: (s) => prog(s.counters.cardsKnown, 50) },
  { id: 'streak-3', name: 'Régulier', desc: '3 jours d’affilée.', emoji: '🔥', rarity: 'commun', check: (s) => s.bestStreak >= 3, progress: (s) => prog(s.bestStreak, 3) },
  { id: 'streak-7', name: 'Semaine de feu', desc: '7 jours d’affilée.', emoji: '🗓️', rarity: 'rare', check: (s) => s.bestStreak >= 7, progress: (s) => prog(s.bestStreak, 7) },
  { id: 'streak-30', name: 'Légende du mois', desc: '30 jours d’affilée.', emoji: '🏅', rarity: 'légendaire', check: (s) => s.bestStreak >= 30, progress: (s) => prog(s.bestStreak, 30) },
  { id: 'level-5', name: 'Ampoule allumée', desc: 'Atteindre le niveau 5.', emoji: '💡', rarity: 'commun', check: (s) => levelFromXp(s.xp) >= 5 },
  { id: 'level-10', name: 'Moteur lancé', desc: 'Atteindre le niveau 10.', emoji: '⚙️', rarity: 'rare', check: (s) => levelFromXp(s.xp) >= 10 },
  { id: 'level-20', name: 'Fusion nucléaire', desc: 'Atteindre le niveau 20.', emoji: '⚛️', rarity: 'légendaire', check: (s) => levelFromXp(s.xp) >= 20 },
];

export const badgeById = (id: string) => BADGES.find((b) => b.id === id);

export function evaluateBadges(s: UserState, ctx: Ctx): string[] {
  return BADGES.filter((b) => !s.badges[b.id] && b.check(s, ctx)).map((b) => b.id);
}

export const RARITY_STYLE: Record<Rarity, string> = {
  commun: 'from-slate-400 to-slate-500',
  rare: 'from-sky-400 to-blue-600',
  épique: 'from-fuchsia-500 to-violet-600',
  légendaire: 'from-amber-400 to-orange-600',
};
