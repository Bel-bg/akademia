import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clock, Cross, Heart, Star } from '@getpapillon/papicons';
import { comboMultiplier, speedBonus, XP } from '@/lib/gamification';
import type { SQ } from '@/lib/quiz';
import { cn, fmtClock } from '@/lib/utils';
import { Inline } from './Markdown';
import { Bar } from './ui';
import { Mascot } from './Mascot';
import { ConfettiBackdrop, DifficultyStars, FlameBadgeIcon, SuccessCheckCircle } from './Decor';

export interface QuizResult {
  results: { id: string; chapter: string; correct: boolean; answerIndex: number; elapsedSeconds: number }[];
  answerXp: number;
  maxCombo: number;
}

interface Props {
  questions: SQ[];
  onFinish(r: QuizResult): void;
  storageKey?: string;
  /** Défi éclair : nombre de vies et durée totale (s). */
  lives?: number;
  timeLimit?: number;
  chapterTitle?(id: string): string;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface SavedQuizSession {
  i: number;
  picked: number | null;
  combo: number;
  maxCombo: number;
  xp: number;
  gain: number | null;
  livesLeft: number;
  left: number;
  results: QuizResult['results'];
  startedAt: number;
  answerXp: number;
}

function readSavedSession(key?: string): SavedQuizSession | null {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as SavedQuizSession : null;
  } catch {
    return null;
  }
}

export default function QuizSession({ questions, onFinish, lives, timeLimit, chapterTitle, storageKey }: Props) {
  const [saved] = useState(() => readSavedSession(storageKey));
  const [i, setI] = useState(saved?.i ?? 0);
  const [picked, setPicked] = useState<number | null>(saved?.picked ?? null);
  const [combo, setCombo] = useState(saved?.combo ?? 0);
  const [maxCombo, setMaxCombo] = useState(saved?.maxCombo ?? 0);
  const [xp, setXp] = useState(saved?.xp ?? 0);
  const [gain, setGain] = useState<number | null>(saved?.gain ?? null);
  const [livesLeft, setLivesLeft] = useState(saved?.livesLeft ?? lives ?? 0);
  const [left, setLeft] = useState(saved?.left ?? timeLimit ?? 0);
  const results = useRef<QuizResult['results']>(saved?.results ?? []);
  const started = useRef(saved?.startedAt ?? Date.now());
  const mounted = useRef(false);
  const done = useRef(false);
  const st = useRef({ xp: saved?.answerXp ?? 0, maxCombo: saved?.maxCombo ?? 0 });

  const q = questions[i];

  const finish = () => {
    if (done.current) return;
    done.current = true;
    if (storageKey) sessionStorage.removeItem(storageKey);
    onFinish({ results: results.current, answerXp: st.current.xp, maxCombo: st.current.maxCombo });
  };

  useEffect(() => {
    if (!storageKey || done.current) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        i, picked, combo, maxCombo, xp, gain, livesLeft, left,
        results: results.current, startedAt: started.current, answerXp: st.current.xp,
      } satisfies SavedQuizSession));
    } catch { /* sessionStorage can be disabled or full */ }
  }, [storageKey, i, picked, combo, maxCombo, xp, gain, livesLeft, left]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    started.current = Date.now();
  }, [i]);

  useEffect(() => {
    if (!timeLimit) return;
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLimit]);

  useEffect(() => {
    if (timeLimit && left <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const answer = (idx: number) => {
    if (picked !== null || !q) return;
    const ok = idx === q.correctIdx;
    setPicked(idx);
    results.current.push({
      id: q.q.id,
      chapter: q.q.chapter,
      correct: ok,
      answerIndex: q.optionIndexes[idx],
      elapsedSeconds: (Date.now() - started.current) / 1000,
    });
    if (ok) {
      const c = combo + 1;
      const secs = (Date.now() - started.current) / 1000;
      const g = Math.round(XP.base[q.q.difficulty] * comboMultiplier(c)) + speedBonus(secs);
      setCombo(c);
      setMaxCombo((m) => Math.max(m, c));
      setXp((x) => x + g);
      setGain(g);
      st.current = { xp: st.current.xp + g, maxCombo: Math.max(st.current.maxCombo, c) };
    } else {
      setCombo(0);
      setGain(null);
      if (lives) setLivesLeft((l) => l - 1);
    }
  };

  const next = () => {
    if (lives && livesLeft <= 0) return finish();
    if (i + 1 >= questions.length) return finish();
    setI(i + 1);
    setPicked(null);
    setGain(null);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (picked === null) {
        const n = ['a', 'b', 'c', 'd', 'e', 'f'].indexOf(k);
        const num = parseInt(k, 10);
        if (n >= 0 && n < q.opts.length) answer(n);
        else if (num >= 1 && num <= q.opts.length) answer(num - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (!q) return null;
  const mult = comboMultiplier(combo);
  const isCorrectAnswer = picked !== null && picked === q.correctIdx;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Barre supérieure de progression, vies, combo & XP */}
      <div className="mb-4 flex items-center gap-2.5">
        {timeLimit ? (
          <span className={cn('chip tabular-nums', left <= 15 && 'bg-bad/15 text-bad')}>
            <Clock size={14} /> {fmtClock(left)}
          </span>
        ) : (
          <span className="chip tabular-nums">
            {i + 1} / {questions.length}
          </span>
        )}
        <div className="flex-1">
          <Bar
            value={timeLimit ? left / timeLimit : (i + (picked !== null ? 1 : 0)) / questions.length}
            h={12}
          />
        </div>
        {lives ? (
          <span className="flex gap-1" aria-label={`${livesLeft} vies`}>
            {Array.from({ length: lives }).map((_, k) => (
              <Heart
                key={k}
                size={20}
                className={k < livesLeft ? 'text-bad' : 'text-line opacity-40'}
              />
            ))}
          </span>
        ) : null}
        <span
          className={cn('chip', combo >= 2 ? 'text-ink' : 'text-muted')}
          title="Combo de bonnes réponses"
        >
          <FlameBadgeIcon size={15} /> x{mult.toFixed(2).replace(/\.?0+$/, '')}
        </span>
        <span className="chip text-brand">
          <Star size={14} />+{xp}
        </span>
      </div>

      {/* Carte de la question */}
      <div className="card p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
          <span className="inline-flex items-center rounded-full bg-soft px-3 py-1 text-brand">
            <DifficultyStars level={q.q.difficulty} />
          </span>
          {chapterTitle && (
            <span className="font-bold normal-case tracking-normal">
              {chapterTitle(q.q.chapter)}
            </span>
          )}
        </div>

        <div className="font-display text-xl font-extrabold leading-snug text-ink sm:text-2xl">
          <Inline text={q.q.q} />
        </div>

        {/* Propositions de réponse */}
        <div className="mt-5 grid gap-3">
          {q.opts.map((o, k) => {
            const isRight = picked !== null && k === q.correctIdx;
            const isWrong = picked === k && k !== q.correctIdx;
            return (
              <button
                key={k}
                type="button"
                disabled={picked !== null}
                onClick={() => answer(k)}
                className={cn(
                  'flex items-center gap-3.5 rounded-3xl border-2 p-4 text-left text-[15px] font-bold transition',
                  picked === null &&
                    'border-line bg-card shadow-sm hover:-translate-y-0.5 hover:border-brand hover:shadow-card active:translate-y-0',
                  isRight && 'border-good bg-good/15 text-ink shadow-sm',
                  isWrong && 'animate-shake border-bad bg-bad/15 text-ink',
                  picked !== null && !isRight && !isWrong && 'border-line/60 opacity-55',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-extrabold',
                    isRight
                      ? 'bg-good text-white'
                      : isWrong
                        ? 'bg-bad text-white'
                        : 'bg-soft text-brand',
                  )}
                >
                  {isRight ? <Check size={16} /> : isWrong ? <Cross size={16} /> : LETTERS[k]}
                </span>
                <span className="flex-1">{o}</span>
              </button>
            );
          })}
        </div>

        {/* ==================== CARTE DE FEEDBACK ("Bonne réponse ! +15 XP / Suivant →") ==================== */}
        {/* Correspond exactement à la vignette en bas à gauche des 4 maquettes */}
        {picked !== null && (
          <div className="relative mt-6 overflow-hidden rounded-3xl bg-bg p-5 text-center animate-pop">
            {isCorrectAnswer && <ConfettiBackdrop />}

            <div className="relative z-10 flex flex-col items-center">
              {isCorrectAnswer ? (
                <SuccessCheckCircle size={56} className="mb-1" />
              ) : (
                <span className="mb-1 flex h-13 w-13 items-center justify-center rounded-full bg-bad text-white shadow-sm">
                  <Cross size={28} />
                </span>
              )}

              <Mascot
                mood={isCorrectAnswer ? 'happy' : 'sad'}
                size={150}
                animate={false}
                className="-my-3"
              />

              <div className="card mt-1 w-full p-5 shadow-card">
                <h3 className="h-display text-2xl font-extrabold text-ink sm:text-3xl">
                  {isCorrectAnswer ? 'Bonne réponse !' : 'Pas tout à fait…'}
                </h3>

                <div className="mt-2 text-sm font-bold leading-relaxed text-muted">
                  <Inline text={q.q.explain} />
                </div>

                {gain !== null && (
                  <div className="mt-4 inline-flex items-center justify-center rounded-2xl bg-soft px-7 py-2 font-display text-2xl font-extrabold text-brand">
                    +{gain} XP
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-lg mt-4 w-full"
                  onClick={next}
                  autoFocus
                >
                  <span>
                    {i + 1 >= questions.length || (lives && livesLeft <= 0)
                      ? 'Voir le résultat'
                      : 'Suivant'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
