const { randomUUID } = require('crypto');

const XP = {
  chapterRead: 25,
  perfectQuiz: 30,
  goodQuiz: 15,
  badge: 20,
  cardKnown: 2,
  cardCap: 40,
  dailyGoal: 50,
  dailyBonus: 20,
  base: { 1: 10, 2: 15, 3: 20 },
};
const BOX_DAYS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateOffset(key, days) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayDifference(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`)) / 86400000);
}

function levelFromXp(xp) {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 40));
}

function defaultState() {
  return {
    v: 1,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: null,
    daily: { date: todayKey(), xp: 0 },
    dailyGoal: XP.dailyGoal,
    chaptersRead: {},
    attempts: [],
    badges: {},
    review: {},
    chapterStats: {},
    examBest: {},
    counters: { quizzes: 0, perfectQuizzes: 0, blitzBest: 0, maxCombo: 0, cardsKnown: 0, exams: 0 },
  };
}

function normalizeState(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const state = { ...base, ...raw };
  state.daily = { ...base.daily, ...(raw.daily || {}) };
  state.counters = { ...base.counters, ...(raw.counters || {}) };
  for (const key of ['chaptersRead', 'attempts', 'badges', 'review', 'chapterStats', 'examBest']) {
    if (!raw[key] || typeof raw[key] !== 'object') state[key] = base[key];
  }
  if (!Array.isArray(state.attempts)) state.attempts = [];
  return state;
}

function badgeIds(state, modules) {
  const readCount = Object.values(state.chaptersRead).reduce((sum, list) => sum + list.length, 0);
  const bestExamRatio = Object.values(state.examBest).reduce((best, exam) => Math.max(best, exam.max ? exam.score / exam.max : 0), 0);
  const allRead = modules.some((module) => module.chapters.length > 0 && (state.chaptersRead[module.id]?.length || 0) >= module.chapters.length);
  const candidates = [
    ['first-step', state.attempts.length >= 1], ['reader-1', readCount >= 1], ['reader-5', readCount >= 5], ['reader-all', allRead],
    ['quiz-5', state.counters.quizzes >= 5], ['quiz-25', state.counters.quizzes >= 25], ['perfect-1', state.counters.perfectQuizzes >= 1],
    ['perfect-5', state.counters.perfectQuizzes >= 5], ['combo-5', state.counters.maxCombo >= 5], ['combo-10', state.counters.maxCombo >= 10],
    ['combo-20', state.counters.maxCombo >= 20], ['blitz-10', state.counters.blitzBest >= 10], ['blitz-20', state.counters.blitzBest >= 20],
    ['exam-1', state.counters.exams >= 1], ['exam-5', state.counters.exams >= 5], ['exam-14', bestExamRatio >= 0.7],
    ['exam-16', bestExamRatio >= 0.8], ['cards-50', state.counters.cardsKnown >= 50], ['streak-3', state.bestStreak >= 3],
    ['streak-7', state.bestStreak >= 7], ['streak-30', state.bestStreak >= 30], ['level-5', levelFromXp(state.xp) >= 5],
    ['level-10', levelFromXp(state.xp) >= 10], ['level-20', levelFromXp(state.xp) >= 20],
  ];
  return candidates.filter(([id, earned]) => earned && !state.badges[id]).map(([id]) => id);
}

function touch(state, gain) {
  const today = todayKey();
  const streak = state.lastActive === today ? state.streak : state.lastActive && dayDifference(state.lastActive, today) === 1 ? state.streak + 1 : 1;
  const daily = state.daily.date === today ? { ...state.daily } : { date: today, xp: 0 };
  const goalReached = daily.xp < state.dailyGoal && daily.xp + gain >= state.dailyGoal;
  const total = state.xp + gain + (goalReached ? XP.dailyBonus : 0);
  daily.xp += gain + (goalReached ? XP.dailyBonus : 0);
  return {
    state: { ...state, xp: total, streak, bestStreak: Math.max(state.bestStreak, streak), lastActive: today, daily },
    goalReached,
  };
}

function finish(state, modules, base, lines, gain) {
  const initialLevel = levelFromXp(state.xp);
  const touched = touch(state, gain);
  if (touched.goalReached) lines.push({ label: 'Objectif du jour atteint', xp: XP.dailyBonus });
  let next = touched.state;
  const newBadges = [];
  for (let pass = 0; pass < 3; pass += 1) {
    const earned = badgeIds(next, modules);
    if (!earned.length) break;
    const badges = { ...next.badges };
    earned.forEach((id) => { badges[id] = new Date().toISOString(); });
    next = { ...next, badges, xp: next.xp + earned.length * XP.badge, daily: { ...next.daily, xp: next.daily.xp + earned.length * XP.badge } };
    newBadges.push(...earned);
  }
  if (newBadges.length) lines.push({ label: `${newBadges.length} badge${newBadges.length > 1 ? 's' : ''} débloqué${newBadges.length > 1 ? 's' : ''}`, xp: newBadges.length * XP.badge });
  const newLevel = levelFromXp(next.xp);
  return {
    state: next,
    summary: {
      ...base,
      xp: gain + (touched.goalReached ? XP.dailyBonus : 0) + newBadges.length * XP.badge,
      lines,
      levelUp: newLevel > initialLevel,
      prevLevel: initialLevel,
      newLevel,
      newBadges,
    },
  };
}

function addAttempt(state, attempt) {
  const entry = { id: randomUUID(), at: new Date().toISOString(), ...attempt };
  return { ...state, attempts: [...state.attempts, entry].slice(-300) };
}

function promote(item, today) {
  const box = Math.min(item.box + 1, 6);
  return box > 5 ? null : { box, due: dateOffset(today, BOX_DAYS[box]), seen: item.seen + 1 };
}

function demote(item, today) {
  return { box: 1, due: dateOffset(today, 1), seen: (item?.seen || 0) + 1 };
}

function requireModule(moduleId, content) {
  const module = content.getModule(moduleId);
  if (!module) throw new Error('Module introuvable');
  return module;
}

function applyChapterRead(state, modules, moduleId, chapterId, content) {
  const module = requireModule(moduleId, content);
  if (!module.chapters.some((chapter) => chapter.id === chapterId)) throw new Error('Chapitre invalide');
  const read = state.chaptersRead[moduleId] || [];
  if (read.includes(chapterId)) return { state, summary: null };
  const next = { ...state, chaptersRead: { ...state.chaptersRead, [moduleId]: [...read, chapterId] } };
  return finish(next, modules, { score: 1, max: 1 }, [{ label: 'Chapitre terminé', xp: XP.chapterRead }], XP.chapterRead);
}

function applyQuiz(state, modules, input, content) {
  const module = requireModule(input.moduleId, content);
  if (!['qcm', 'blitz', 'review'].includes(input.kind) || !Array.isArray(input.results) || input.results.length > 100) throw new Error('Tentative invalide');
  const questions = new Map(content.getQuiz(input.moduleId).map((question) => [question.id, question]));
  const ids = new Set();
  let combo = 0;
  let maxCombo = 0;
  let answerXp = 0;
  const results = input.results.map((result) => {
    const question = questions.get(result.id);
    if (!question || ids.has(result.id) || !Number.isInteger(result.answerIndex) || result.answerIndex < 0 || result.answerIndex >= question.options.length) throw new Error('Réponse invalide');
    ids.add(result.id);
    const correct = result.answerIndex === question.answer;
    const elapsedSeconds = Math.max(0, Math.min(60, Number(result.elapsedSeconds) || 0));
    if (correct) {
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      answerXp += Math.round(XP.base[question.difficulty] * (1 + Math.min(combo - 1, 4) * 0.25)) + (elapsedSeconds < 6 ? 3 : 0);
    } else combo = 0;
    return { id: question.id, chapter: question.chapter, correct };
  });
  const correctCount = results.filter((result) => result.correct).length;
  const total = results.length;
  const perfect = total >= 5 && correctCount === total;
  const lines = [];
  if (answerXp > 0) lines.push({ label: `${correctCount} bonne${correctCount > 1 ? 's' : ''} réponse${correctCount > 1 ? 's' : ''}`, xp: answerXp });
  let bonus = 0;
  if (input.kind !== 'blitz') {
    if (perfect) { bonus = XP.perfectQuiz; lines.push({ label: 'Sans faute !', xp: bonus }); }
    else if (total >= 5 && correctCount / total >= 0.8) { bonus = XP.goodQuiz; lines.push({ label: 'Plus de 80 %', xp: bonus }); }
  }
  const today = todayKey();
  const review = { ...state.review };
  const chapterStats = { ...state.chapterStats };
  for (const result of results) {
    const key = `${input.moduleId}:${result.id}`;
    const current = review[key];
    if (result.correct) {
      if (current) { const next = promote(current, today); if (next) review[key] = next; else delete review[key]; }
    } else review[key] = demote(current, today);
    const statKey = `${input.moduleId}:${result.chapter}`;
    const previous = chapterStats[statKey] || { answered: 0, correct: 0 };
    chapterStats[statKey] = { answered: previous.answered + 1, correct: previous.correct + (result.correct ? 1 : 0) };
  }
  const next = {
    ...state,
    review,
    chapterStats,
    counters: {
      ...state.counters,
      quizzes: state.counters.quizzes + (input.kind === 'blitz' ? 0 : 1),
      perfectQuizzes: state.counters.perfectQuizzes + (perfect && input.kind !== 'blitz' ? 1 : 0),
      blitzBest: input.kind === 'blitz' ? Math.max(state.counters.blitzBest, correctCount) : state.counters.blitzBest,
      maxCombo: Math.max(state.counters.maxCombo, maxCombo),
    },
  };
  const attempted = addAttempt(next, { moduleId: module.id, kind: input.kind, label: String(input.label || (input.kind === 'blitz' ? 'Défi éclair' : 'QCM')).slice(0, 120), score: correctCount, max: total, xp: answerXp + bonus });
  return { ...finish(attempted, modules, { score: correctCount, max: total }, lines, answerXp + bonus), results };
}

function applyExam(state, modules, input, content) {
  const module = requireModule(input.moduleId, content);
  const examNumber = Number(input.n);
  const exam = Number.isInteger(examNumber) && examNumber > 0 ? content.getExam(module.id, examNumber) : null;
  const score = Number(input.score);
  if (!exam || !Number.isFinite(score) || score < 0 || score > exam.points) throw new Error('Note invalide');
  const key = `${module.id}:${exam.n}`;
  const previous = state.examBest[key];
  const gain = previous ? 10 + Math.max(0, Math.round(((score - previous.score) / exam.points) * 200)) : Math.round((score / exam.points) * 200);
  const lines = previous
    ? [{ label: 'Participation', xp: 10 }, ...(gain > 10 ? [{ label: 'Progression sur ton meilleur score', xp: gain - 10 }] : [])]
    : [{ label: `Première tentative : ${Math.round(score * 100) / 100}/${exam.points}`, xp: gain }];
  const best = !previous || score > previous.score ? { score, max: exam.points } : previous;
  const next = {
    ...state,
    examBest: { ...state.examBest, [key]: best },
    counters: { ...state.counters, exams: state.counters.exams + 1 },
  };
  const attempted = addAttempt(next, { moduleId: module.id, kind: 'exam', label: exam.title, score, max: exam.points, xp: gain });
  return finish(attempted, modules, { score, max: exam.points }, lines, gain);
}

function applyCards(state, modules, input, content) {
  const module = requireModule(input.moduleId, content);
  if (!Array.isArray(input.known) || !Array.isArray(input.unknown) || input.known.length + input.unknown.length > 100) throw new Error('Série de cartes invalide');
  const cards = new Set(content.getCards(module.id).map((card) => card.id));
  const known = [...new Set(input.known)];
  const unknown = [...new Set(input.unknown)];
  if ([...known, ...unknown].some((id) => !cards.has(id)) || known.some((id) => unknown.includes(id))) throw new Error('Carte invalide');
  const today = todayKey();
  const review = { ...state.review };
  for (const id of known) {
    const key = `${module.id}:fc:${id}`;
    const current = review[key];
    if (current) { const next = promote(current, today); if (next) review[key] = next; else delete review[key]; }
    else review[key] = { box: 2, due: dateOffset(today, BOX_DAYS[2]), seen: 1 };
  }
  for (const id of unknown) review[`${module.id}:fc:${id}`] = demote(review[`${module.id}:fc:${id}`], today);
  const gain = Math.min(XP.cardCap, known.length * XP.cardKnown);
  const lines = gain ? [{ label: `${known.length} carte${known.length > 1 ? 's' : ''} maîtrisée${known.length > 1 ? 's' : ''}`, xp: gain }] : [];
  const next = { ...state, review, counters: { ...state.counters, cardsKnown: state.counters.cardsKnown + known.length } };
  const attempted = addAttempt(next, { moduleId: module.id, kind: 'cards', label: 'Cartes mémoire', score: known.length, max: known.length + unknown.length, xp: gain });
  return finish(attempted, modules, { score: known.length, max: known.length + unknown.length }, lines, gain);
}

function applyAction(rawState, input, content) {
  const state = normalizeState(rawState);
  const modules = content.getModules();
  if (!input || typeof input !== 'object') throw new Error('Action invalide');
  if (input.type === 'chapter-read') return applyChapterRead(state, modules, input.moduleId, input.chapterId, content);
  if (input.type === 'quiz') return applyQuiz(state, modules, input, content);
  if (input.type === 'exam') return applyExam(state, modules, input, content);
  if (input.type === 'cards') return applyCards(state, modules, input, content);
  if (input.type === 'reset') return { state: defaultState(), summary: null };
  throw new Error('Action inconnue');
}

function importLegacyState(rawState, content) {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) throw new Error('Progression à importer invalide');
  const modules = content.getModules();
  let state = defaultState();
  const readEntries = Object.entries(rawState.chaptersRead || {});
  if (readEntries.length > 100) throw new Error('Progression à importer trop volumineuse');
  for (const [moduleId, chapterIds] of readEntries) {
    if (!Array.isArray(chapterIds)) continue;
    for (const chapterId of [...new Set(chapterIds)].slice(0, 100)) {
      try { state = applyChapterRead(state, modules, moduleId, chapterId, content).state; } catch { /* ignore unknown legacy content */ }
    }
  }
  const examEntries = Object.entries(rawState.examBest || {});
  if (examEntries.length > 100) throw new Error('Progression à importer trop volumineuse');
  for (const [key, best] of examEntries) {
    const match = key.match(/^([a-z0-9-]+):(\d+)$/i);
    if (!match || !best || typeof best !== 'object') continue;
    const exam = content.getExam(match[1], Number(match[2]));
    const score = Number(best.score);
    if (!exam || Number(best.max) !== exam.points || !Number.isFinite(score) || score < 0 || score > exam.points) continue;
    state = applyExam(state, modules, { moduleId: match[1], n: exam.n, score }, content).state;
  }
  return state;
}

module.exports = { applyAction, defaultState, importLegacyState, normalizeState, levelFromXp };