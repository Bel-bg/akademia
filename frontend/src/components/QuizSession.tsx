import { useEffect, useRef, useState } from 'react';
import { Check, Flame, Heart, X, Zap } from 'lucide-react';
import { comboMultiplier, speedBonus, XP } from '@/lib/gamification';
import type { SQ } from '@/lib/quiz';
import { cn, fmtClock } from '@/lib/utils';
import { Inline } from './Markdown';
import { Bar } from './ui';

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
    results.current.push({ id: q.q.id, chapter: q.q.chapter, correct: ok, answerIndex: q.optionIndexes[idx], elapsedSeconds: (Date.now() - started.current) / 1000 });
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

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        {timeLimit ? (
          <span className={cn('chip tabular-nums', left <= 15 && 'text-bad')}>⏱ {fmtClock(left)}</span>
        ) : (
          <span className="chip tabular-nums">{i + 1} / {questions.length}</span>
        )}
        <div className="flex-1">
          <Bar value={timeLimit ? left / timeLimit : (i + (picked !== null ? 1 : 0)) / questions.length} />
        </div>
        {lives ? (
          <span className="flex gap-0.5" aria-label={`${livesLeft} vies`}>
            {Array.from({ length: lives }).map((_, k) => (
              <Heart key={k} size={18} className={k < livesLeft ? 'fill-bad text-bad' : 'text-line'} />
            ))}
          </span>
        ) : null}
        <span className={cn('chip', combo >= 2 ? 'text-accent' : 'text-muted')} title="Combo de bonnes réponses">
          <Flame size={13} /> x{mult.toFixed(2).replace(/\.?0+$/, '')}
        </span>
        <span className="chip text-brand"><Zap size={13} />{xp}</span>
      </div>

      <div className="card p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
          <span>{'★'.repeat(q.q.difficulty)}{'☆'.repeat(3 - q.q.difficulty)}</span>
          {chapterTitle && <span className="normal-case tracking-normal">· {chapterTitle(q.q.chapter)}</span>}
        </div>
        <div className="text-[19px] font-bold leading-snug"><Inline text={q.q.q} /></div>

        <div className="mt-5 grid gap-2.5">
          {q.opts.map((o, k) => {
            const isRight = picked !== null && k === q.correctIdx;
            const isWrong = picked === k && k !== q.correctIdx;
            return (
              <button
                key={k}
                disabled={picked !== null}
                onClick={() => answer(k)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left text-[15px] transition',
                  picked === null && 'border-line bg-card hover:-translate-y-0.5 hover:border-brand hover:shadow-card',
                  isRight && 'border-good bg-good/10',
                  isWrong && 'animate-shake border-bad bg-bad/10',
                  picked !== null && !isRight && !isWrong && 'border-line opacity-60',
                )}
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold', isRight ? 'bg-good text-white' : isWrong ? 'bg-bad text-white' : 'bg-soft text-muted')}>
                  {isRight ? <Check size={15} /> : isWrong ? <X size={15} /> : LETTERS[k]}
                </span>
                <span className="pt-0.5">{o}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-5 animate-fadeIn">
            <div className={cn('rounded-2xl p-4 text-sm', picked === q.correctIdx ? 'bg-good/10' : 'bg-bad/10')}>
              <div className="mb-1 flex items-center justify-between font-extrabold">
                <span className={picked === q.correctIdx ? 'text-good' : 'text-bad'}>{picked === q.correctIdx ? 'Bonne réponse !' : 'Pas tout à fait…'}</span>
                {gain !== null && <span className="animate-floatUp text-accent">+{gain} XP</span>}
              </div>
              <Inline text={q.q.explain} />
            </div>
            <button className="btn btn-primary btn-lg mt-4 w-full" onClick={next} autoFocus>
              {i + 1 >= questions.length || (lives && livesLeft <= 0) ? 'Voir le résultat' : 'Question suivante'}
            </button>
            <p className="mt-2 text-center text-xs text-muted">Astuce : touches A–D pour répondre, Entrée pour continuer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
