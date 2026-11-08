/**
 * Chargement du contenu pédagogique.
 * L’API backend concentre désormais la source de vérité pour les données pédagogiques,
 * tandis que le système local reste en fallback pour garder l’application fonctionnelle.
 */
import type { ChapterMeta, Exam, ExamIndexItem, Flashcard, ModuleMeta, Question } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

const metaFiles = import.meta.glob('/content/modules/*/module.json', { eager: true, import: 'default' }) as Record<string, ModuleMeta>;
const chapterLoaders = import.meta.glob('/content/modules/*/chapters/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
const quizLoaders = import.meta.glob('/content/modules/*/quiz.json', { import: 'default' }) as Record<string, () => Promise<Question[]>>;
const cardLoaders = import.meta.glob('/content/modules/*/flashcards.json', { import: 'default' }) as Record<string, () => Promise<Flashcard[]>>;
const examIndexLoaders = import.meta.glob('/content/modules/*/exams-index.json', { import: 'default' }) as Record<string, () => Promise<ExamIndexItem[]>>;
const examLoaders = import.meta.glob('/content/modules/*/exams/*.json', { import: 'default' }) as Record<string, () => Promise<Exam>>;

export async function prepareOfflineContent(): Promise<void> {
  if (!navigator.onLine) return;
  const loaders = [...Object.values(chapterLoaders), ...Object.values(quizLoaders)];
  await Promise.allSettled(loaders.map((load) => load()));
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API introuvable: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function apiGetText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API introuvable: ${path}`);
  }
  return res.text();
}

export const modules: ModuleMeta[] = Object.values(metaFiles).sort((a, b) => a.title.localeCompare(b.title, 'fr'));

export function getModule(id: string | undefined): ModuleMeta | undefined {
  return modules.find((m) => m.id === id);
}
export function getChapter(mod: ModuleMeta, chapterId: string | undefined): ChapterMeta | undefined {
  return mod.chapters.find((c) => c.id === chapterId);
}
export function chapterNeighbors(mod: ModuleMeta, chapterId: string) {
  const i = mod.chapters.findIndex((c) => c.id === chapterId);
  return { prev: i > 0 ? mod.chapters[i - 1] : undefined, next: i >= 0 && i < mod.chapters.length - 1 ? mod.chapters[i + 1] : undefined };
}

const cache = new Map<string, Promise<unknown>>();
function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}
function pick<T>(map: Record<string, () => Promise<T>>, path: string): () => Promise<T> {
  const f = map[path];
  if (!f) return () => Promise.reject(new Error(`Contenu introuvable : ${path}`));
  return f;
}

export const loadChapter = (moduleId: string, file: string) =>
  memo(`ch:${moduleId}:${file}`, async () => {
    try {
      return await apiGetText(`/modules/${encodeURIComponent(moduleId)}/chapters/${encodeURIComponent(file)}`);
    } catch {
      return pick(chapterLoaders, `/content/modules/${moduleId}/chapters/${file}`)();
    }
  });

export const loadQuiz = (moduleId: string) =>
  memo(`quiz:${moduleId}`, async () => {
    try {
      return await apiGet<Question[]>(`/modules/${encodeURIComponent(moduleId)}/quiz`);
    } catch {
      return quizLoaders[`/content/modules/${moduleId}/quiz.json`] ? quizLoaders[`/content/modules/${moduleId}/quiz.json`]() : Promise.resolve([] as Question[]);
    }
  });

export const loadCards = (moduleId: string) =>
  memo(`cards:${moduleId}`, async () => {
    try {
      return await apiGet<Flashcard[]>(`/modules/${encodeURIComponent(moduleId)}/cards`);
    } catch {
      return cardLoaders[`/content/modules/${moduleId}/flashcards.json`] ? cardLoaders[`/content/modules/${moduleId}/flashcards.json`]() : Promise.resolve([] as Flashcard[]);
    }
  });

export const loadExamIndex = (moduleId: string) =>
  memo(`exidx:${moduleId}`, async () => {
    try {
      return await apiGet<ExamIndexItem[]>(`/modules/${encodeURIComponent(moduleId)}/exams-index`);
    } catch {
      return examIndexLoaders[`/content/modules/${moduleId}/exams-index.json`] ? examIndexLoaders[`/content/modules/${moduleId}/exams-index.json`]() : Promise.resolve([] as ExamIndexItem[]);
    }
  });

export const loadExam = (moduleId: string, n: number) =>
  memo(`exam:${moduleId}:${n}`, async () => {
    try {
      return await apiGet<Exam>(`/modules/${encodeURIComponent(moduleId)}/exams/${encodeURIComponent(String(n).padStart(2, '0'))}`);
    } catch {
      return pick(examLoaders, `/content/modules/${moduleId}/exams/e${String(n).padStart(2, '0')}.json`)();
    }
  });
