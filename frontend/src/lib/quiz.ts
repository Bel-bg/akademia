import type { Question } from './types';
import { shuffle } from './utils';

/** Question dont les options ont été mélangées pour cette session. */
export interface SQ {
  q: Question;
  opts: string[];
  optionIndexes: number[];
  correctIdx: number;
}

export function toSession(q: Question): SQ {
  const order = shuffle(q.options.map((_, i) => i));
  return { q, opts: order.map((i) => q.options[i]), optionIndexes: order, correctIdx: order.indexOf(q.answer) };
}

export interface Filter {
  chapters: string[]; // vide = tous
  difficulty: 0 | 1 | 2 | 3; // 0 = mixte
  count: number;
}

export function buildQuiz(pool: Question[], f: Filter): SQ[] {
  let p = pool;
  if (f.chapters.length) p = p.filter((q) => f.chapters.includes(q.chapter));
  if (f.difficulty) {
    const d = p.filter((q) => q.difficulty === f.difficulty);
    p = d.length >= Math.min(f.count, 5) ? d : p;
  }
  return shuffle(p).slice(0, f.count).map(toSession);
}
