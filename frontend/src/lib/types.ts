// ---------- Contenu (défini dans /content/modules/<id>) ----------
export interface ChapterMeta {
  id: string;
  number: string;
  title: string;
  summary: string;
  minutes: number;
  file: string;
}
export interface PartMeta {
  id: string;
  title: string;
  chapters: string[];
}
export interface ModuleMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;
  level: string;
  estimatedHours: number;
  parts: PartMeta[];
  chapters: ChapterMeta[];
  features: { quiz?: boolean; blitz?: boolean; exams?: boolean; flashcards?: boolean };
}
export interface Question {
  id: string;
  chapter: string;
  difficulty: 1 | 2 | 3;
  q: string;
  options: string[];
  answer: number;
  explain: string;
}
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tag: string;
}
export interface ExamIndexItem {
  n: number;
  title: string;
  scenario: string;
  cas: string;
  durationMinutes: number;
  points: number;
}
export interface ExamQuestion {
  id: string;
  q: string;
  a: string;
  points: number;
}
export interface ExamPart {
  id: string;
  title: string;
  points: number;
  intro?: string;
  context?: string;
  questions: ExamQuestion[];
}
export interface Exam {
  n: number;
  title: string;
  durationMinutes: number;
  points: number;
  parts: ExamPart[];
}

// ---------- Progression de l'utilisateur ----------
export type AttemptKind = 'qcm' | 'blitz' | 'review' | 'exam' | 'cards';

export interface Attempt {
  id: string;
  at: string; // ISO
  moduleId: string;
  kind: AttemptKind;
  label: string;
  score: number;
  max: number;
  xp: number;
}
export interface ReviewItem {
  box: number; // 1..5 (Leitner)
  due: string; // YYYY-MM-DD
  seen: number;
}
export interface UserState {
  v: 1;
  xp: number;
  streak: number;
  bestStreak: number;
  lastActive: string | null;
  daily: { date: string; xp: number };
  dailyGoal: number;
  chaptersRead: Record<string, string[]>;
  attempts: Attempt[];
  badges: Record<string, string>;
  review: Record<string, ReviewItem>;
  chapterStats: Record<string, { answered: number; correct: number }>;
  examBest: Record<string, { score: number; max: number }>;
  counters: {
    quizzes: number;
    perfectQuizzes: number;
    blitzBest: number;
    maxCombo: number;
    cardsKnown: number;
    exams: number;
  };
}

export interface XpLine {
  label: string;
  xp: number;
}
export interface Summary {
  xp: number;
  lines: XpLine[];
  levelUp: boolean;
  prevLevel: number;
  newLevel: number;
  newBadges: string[];
  score: number;
  max: number;
}
