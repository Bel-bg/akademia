import type { ModuleMeta, UserState } from './types';

export function readCount(s: UserState, m: ModuleMeta): number {
  const read = new Set(s.chaptersRead[m.id] ?? []);
  return m.chapters.filter((c) => read.has(c.id)).length;
}
export function moduleRatio(s: UserState, m: ModuleMeta): number {
  return m.chapters.length ? readCount(s, m) / m.chapters.length : 0;
}
export function nextChapter(s: UserState, m: ModuleMeta) {
  const read = new Set(s.chaptersRead[m.id] ?? []);
  return m.chapters.find((c) => !read.has(c.id)) ?? m.chapters[0];
}
export function chapterAccuracy(s: UserState, moduleId: string, chapterId: string): number | null {
  const st = s.chapterStats[`${moduleId}:${chapterId}`];
  return st && st.answered > 0 ? st.correct / st.answered : null;
}
