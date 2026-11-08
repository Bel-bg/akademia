/**
 * Logique de progression : fonctions pures (état -> nouvel état + résumé).
 * Facile à tester et indépendante du stockage (local ou Supabase).
 */
import { BADGES, Ctx, XP, evaluateBadges, levelFromXp } from './gamification';
import type { Attempt, AttemptKind, BackendThemeId, FiliereId, Summary, UserState, XpLine } from './types';
import { addDays, diffDays, todayKey, uid } from './utils';

export function normalizeFiliere(value: unknown): FiliereId | null {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  return upper === 'ARI' || upper === 'AIP' ? upper : null;
}

export function themeForFiliere(filiere: FiliereId | null | undefined): BackendThemeId {
  return filiere === 'AIP' ? 'violet' : 'corail';
}

export function defaultState(): UserState {
  return {
    v: 1, filiere: null, theme: 'corail', xp: 0, streak: 0, bestStreak: 0, lastActive: null,
    daily: { date: todayKey(), xp: 0 }, dailyGoal: XP.dailyGoal,
    chaptersRead: {}, attempts: [], badges: {}, review: {}, chapterStats: {}, examBest: {},
    counters: { quizzes: 0, perfectQuizzes: 0, blitzBest: 0, maxCombo: 0, cardsKnown: 0, exams: 0 },
  };
}

export function normalizeState(raw: unknown): UserState {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<UserState>;
  const filiere = normalizeFiliere(r.filiere);
  return {
    ...d, ...r,
    filiere,
    theme: themeForFiliere(filiere),
    daily: { ...d.daily, ...(r.daily ?? {}) },
    counters: { ...d.counters, ...(r.counters ?? {}) },
    chaptersRead: r.chaptersRead ?? {}, attempts: r.attempts ?? [], badges: r.badges ?? {},
    review: r.review ?? {}, chapterStats: r.chapterStats ?? {}, examBest: r.examBest ?? {},
  };
}

export function applySetFiliere(s: UserState, filiere: FiliereId): { state: UserState; summary: Summary | null } {
  const normalized = normalizeFiliere(filiere) ?? 'ARI';
  return {
    state: {
      ...s,
      filiere: normalized,
      theme: themeForFiliere(normalized),
    },
    summary: null,
  };
}

export function isFresh(s: UserState): boolean {
  return s.xp === 0 && s.attempts.length === 0 && Object.keys(s.chaptersRead).length === 0;
}

/** Ajoute de l'XP, met à jour la série (streak) et l'objectif du jour. */
function touch(s: UserState, xp: number): { state: UserState; levelUp: boolean; prevLevel: number; newLevel: number; goalReached: boolean } {
  const today = todayKey();
  let streak = s.streak;
  if (s.lastActive !== today) {
    streak = s.lastActive && diffDays(s.lastActive, today) === 1 ? s.streak + 1 : 1;
  }
  const daily = s.daily.date === today ? { ...s.daily } : { date: today, xp: 0 };
  const before = daily.xp;
  daily.xp += xp;
  const goalReached = before < s.dailyGoal && daily.xp >= s.dailyGoal;
  const total = s.xp + xp + (goalReached ? XP.dailyBonus : 0);
  if (goalReached) daily.xp += XP.dailyBonus;
  const prevLevel = levelFromXp(s.xp);
  const newLevel = levelFromXp(total);
  return {
    state: { ...s, xp: total, streak, bestStreak: Math.max(s.bestStreak, streak), lastActive: today, daily },
    levelUp: newLevel > prevLevel, prevLevel, newLevel, goalReached,
  };
}

function withBadges(s: UserState, ctx: Ctx, lines: XpLine[]): { state: UserState; newBadges: string[]; extra: number } {
  let state = s;
  const all: string[] = [];
  // plusieurs passes : un badge peut en débloquer un autre (niveau)
  for (let i = 0; i < 3; i++) {
    const ids = evaluateBadges(state, ctx);
    if (!ids.length) break;
    const now = new Date().toISOString();
    const badges = { ...state.badges };
    ids.forEach((id) => (badges[id] = now));
    state = { ...state, badges, xp: state.xp + ids.length * XP.badge, daily: { ...state.daily, xp: state.daily.xp + ids.length * XP.badge } };
    all.push(...ids);
  }
  if (all.length) lines.push({ label: `${all.length} badge${all.length > 1 ? 's' : ''} débloqué${all.length > 1 ? 's' : ''}`, xp: all.length * XP.badge });
  return { state, newBadges: all, extra: all.length * XP.badge };
}

function pushAttempt(s: UserState, a: Omit<Attempt, 'id' | 'at'>): UserState {
  const att: Attempt = { id: uid(), at: new Date().toISOString(), ...a };
  return { ...s, attempts: [...s.attempts, att].slice(-300) };
}

function finish(s0: UserState, ctx: Ctx, base: Omit<Summary, 'xp' | 'lines' | 'levelUp' | 'prevLevel' | 'newLevel' | 'newBadges'>, lines: XpLine[], gain: number) {
  const t = touch(s0, gain);
  if (t.goalReached) lines.push({ label: 'Objectif du jour atteint', xp: XP.dailyBonus });
  const prevLevel = levelFromXp(s0.xp);
  const b = withBadges(t.state, ctx, lines);
  const newLevel = levelFromXp(b.state.xp);
  const total = gain + (t.goalReached ? XP.dailyBonus : 0) + b.extra;
  const summary: Summary = { ...base, xp: total, lines, levelUp: newLevel > prevLevel, prevLevel, newLevel, newBadges: b.newBadges };
  return { state: b.state, summary };
}

// ---------- Répétition espacée (Leitner) ----------
export const BOX_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
function promote(it: { box: number; seen: number }, today: string) {
  const box = Math.min(it.box + 1, 6);
  return box > 5 ? null : { box, due: addDays(today, BOX_DAYS[box]), seen: it.seen + 1 };
}
const demote = (it: { seen: number } | undefined, today: string) => ({ box: 1, due: addDays(today, 1), seen: (it?.seen ?? 0) + 1 });

export const reviewKey = (moduleId: string, id: string) => `${moduleId}:${id}`;

export function dueQuestionIds(s: UserState, moduleId: string): string[] {
  const today = todayKey();
  return Object.entries(s.review)
    .filter(([k, v]) => k.startsWith(moduleId + ':') && !k.startsWith(moduleId + ':fc:') && v.due <= today)
    .map(([k]) => k.slice(moduleId.length + 1));
}
export function dueCardIds(s: UserState, moduleId: string): string[] {
  const today = todayKey();
  return Object.entries(s.review)
    .filter(([k, v]) => k.startsWith(moduleId + ':fc:') && v.due <= today)
    .map(([k]) => k.slice(moduleId.length + 4));
}
export function knownCardIds(s: UserState, moduleId: string): Set<string> {
  return new Set(Object.keys(s.review).filter((k) => k.startsWith(moduleId + ':fc:')).map((k) => k.slice(moduleId.length + 4)));
}

// ---------- Actions ----------
export function applyChapterRead(s: UserState, ctx: Ctx, moduleId: string, chapterId: string) {
  const list = s.chaptersRead[moduleId] ?? [];
  if (list.includes(chapterId)) return { state: s, summary: null as Summary | null };
  const next: UserState = { ...s, chaptersRead: { ...s.chaptersRead, [moduleId]: [...list, chapterId] } };
  const lines: XpLine[] = [{ label: 'Chapitre terminé', xp: XP.chapterRead }];
  const r = finish(next, ctx, { score: 1, max: 1 }, lines, XP.chapterRead);
  return { state: r.state, summary: r.summary };
}

export interface QuizInput {
  moduleId: string;
  kind: Extract<AttemptKind, 'qcm' | 'blitz' | 'review'>;
  label: string;
  results: { id: string; chapter: string; correct: boolean; answerIndex: number; elapsedSeconds: number }[];
  answerXp: number;
  maxCombo: number;
}
export function applyQuiz(s: UserState, ctx: Ctx, inp: QuizInput) {
  const today = todayKey();
  const total = inp.results.length;
  const ok = inp.results.filter((r) => r.correct).length;
  const perfect = total >= 5 && ok === total;
  const lines: XpLine[] = [];
  if (inp.answerXp > 0) lines.push({ label: `${ok} bonne${ok > 1 ? 's' : ''} réponse${ok > 1 ? 's' : ''}`, xp: inp.answerXp });
  let bonus = 0;
  if (inp.kind !== 'blitz') {
    if (perfect) { bonus = XP.perfectQuiz; lines.push({ label: 'Sans faute !', xp: bonus }); }
    else if (total >= 5 && ok / total >= 0.8) { bonus = XP.goodQuiz; lines.push({ label: 'Plus de 80 %', xp: bonus }); }
  }
  const review = { ...s.review };
  const stats = { ...s.chapterStats };
  for (const r of inp.results) {
    const k = reviewKey(inp.moduleId, r.id);
    const cur = review[k];
    if (r.correct) {
      if (cur) {
        const nx = promote(cur, today);
        if (nx) review[k] = nx; else delete review[k];
      }
    } else review[k] = demote(cur, today);
    const sk = `${inp.moduleId}:${r.chapter}`;
    const old = stats[sk] ?? { answered: 0, correct: 0 };
    stats[sk] = { answered: old.answered + 1, correct: old.correct + (r.correct ? 1 : 0) };
  }
  let next: UserState = {
    ...s, review, chapterStats: stats,
    counters: {
      ...s.counters,
      quizzes: s.counters.quizzes + (inp.kind === 'blitz' ? 0 : 1),
      perfectQuizzes: s.counters.perfectQuizzes + (perfect && inp.kind !== 'blitz' ? 1 : 0),
      blitzBest: inp.kind === 'blitz' ? Math.max(s.counters.blitzBest, ok) : s.counters.blitzBest,
      maxCombo: Math.max(s.counters.maxCombo, inp.maxCombo),
    },
  };
  const gain = inp.answerXp + bonus;
  next = pushAttempt(next, { moduleId: inp.moduleId, kind: inp.kind, label: inp.label, score: ok, max: total, xp: gain });
  return finish(next, ctx, { score: ok, max: total }, lines, gain);
}

export interface ExamInput {
  moduleId: string;
  n: number;
  label: string;
  score: number;
  max: number;
}
export function applyExam(s: UserState, ctx: Ctx, inp: ExamInput) {
  const key = `${inp.moduleId}:${inp.n}`;
  const prev = s.examBest[key];
  const lines: XpLine[] = [];
  let gain: number;
  if (!prev) {
    gain = Math.round((inp.score / inp.max) * 200);
    lines.push({ label: `Première tentative : ${Math.round(inp.score * 100) / 100}/${inp.max}`, xp: gain });
  } else {
    const improvement = Math.max(0, Math.round(((inp.score - prev.score) / inp.max) * 200));
    gain = 10 + improvement;
    lines.push({ label: 'Participation', xp: 10 });
    if (improvement > 0) lines.push({ label: 'Progression sur ton meilleur score', xp: improvement });
  }
  const best = !prev || inp.score > prev.score ? { score: inp.score, max: inp.max } : prev;
  let next: UserState = {
    ...s, examBest: { ...s.examBest, [key]: best },
    counters: { ...s.counters, exams: s.counters.exams + 1 },
  };
  next = pushAttempt(next, { moduleId: inp.moduleId, kind: 'exam', label: inp.label, score: inp.score, max: inp.max, xp: gain });
  return finish(next, ctx, { score: inp.score, max: inp.max }, lines, gain);
}

export interface CardsInput {
  moduleId: string;
  known: string[];
  unknown: string[];
}
export function applyCards(s: UserState, ctx: Ctx, inp: CardsInput) {
  const today = todayKey();
  const review = { ...s.review };
  for (const id of inp.known) {
    const k = `${inp.moduleId}:fc:${id}`;
    const cur = review[k];
    if (cur) { const nx = promote(cur, today); if (nx) review[k] = nx; else delete review[k]; }
    else review[k] = { box: 2, due: addDays(today, BOX_DAYS[2]), seen: 1 };
  }
  for (const id of inp.unknown) review[`${inp.moduleId}:fc:${id}`] = demote(review[`${inp.moduleId}:fc:${id}`], today);
  const gain = Math.min(XP.cardCap, inp.known.length * XP.cardKnown);
  const lines: XpLine[] = gain ? [{ label: `${inp.known.length} carte${inp.known.length > 1 ? 's' : ''} maîtrisée${inp.known.length > 1 ? 's' : ''}`, xp: gain }] : [];
  let next: UserState = { ...s, review, counters: { ...s.counters, cardsKnown: s.counters.cardsKnown + inp.known.length } };
  next = pushAttempt(next, { moduleId: inp.moduleId, kind: 'cards', label: 'Cartes mémoire', score: inp.known.length, max: inp.known.length + inp.unknown.length, xp: gain });
  return finish(next, ctx, { score: inp.known.length, max: inp.known.length + inp.unknown.length }, lines, gain);
}

export function badgeProgressTotal(): number {
  return BADGES.length;
}
