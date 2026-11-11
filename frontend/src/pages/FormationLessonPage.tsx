import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Cross as X } from '@getpapillon/papicons';
import { Spinner } from '@/components/ui';
import { CoachBubble, TypingDots, UserBubble } from '@/components/CoachBubble';
import { GlassesCloud } from '@/components/GlassesCloud';
import { Inline } from '@/components/Markdown';
import { fireConfetti } from '@/components/Celebrations';
import { AnimatedEmoji, renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';
import { getModule, loadFormations } from '@/lib/content';
import type { Formation, FormationStep, Summary } from '@/lib/types';
import { useStore } from '@/state/Store';

/** Normalise une requête SQL pour la comparer : casse, espaces, ponctuation, `!=`. Les littéraux 'texte' restent sensibles à la casse. */
export function normalizeSql(sql: string): string {
  return sql
    .split(/('[^']*')/g)
    .map((part, i) => (i % 2 ? part : part.toLowerCase()))
    .join('')
    .replace(/--.*$/gm, '')
    .replace(/!=|\^=/g, '<>')
    .replace(/\b(inner|left outer|right outer|full outer) join\b/g, (_, k: string) => (k === 'inner' ? 'join' : k.split(' ')[0] + ' join'))
    .replace(/\s+as\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,()=<>+\-*/|])\s*/g, '$1')
    .replace(/;\s*$/, '')
    .trim();
}

/** Normalise une commande shell : espaces, tubes et redirections ; la casse est conservée, ainsi que le contenu des guillemets. */
export function normalizeShell(cmd: string): string {
  return cmd
    .split(/("[^"]*"|'[^']*')/g)
    .map((part, i) => (i % 2 ? part : part.replace(/\s+/g, ' ').replace(/\s*(\||&&|;|>>|>|<)\s*/g, '$1')))
    .join('')
    .trim()
    .replace(/;$/, '');
}

const delayFor = (s: FormationStep) => (s.type === 'say' ? Math.min(1500, 500 + s.text.length * 9) : 550);
const isInteractive = (s: FormationStep) => s.type === 'choice' || s.type === 'exercise';

type Result = { ok: boolean; picked?: number; tries: number; text?: string };

export default function FormationLessonPage() {
  const { moduleId, fid, lessonId } = useParams();
  const m = getModule(moduleId);
  const [list, setList] = useState<Formation[] | null>(null);
  useEffect(() => {
    if (!moduleId) return;
    let alive = true;
    loadFormations(moduleId).then((x) => alive && setList(x)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [moduleId]);
  if (!m) return <Navigate to="/modules" replace />;
  if (!list) return <Spinner />;
  const f = list.find((x) => x.id === fid);
  const lesson = f?.lessons.find((l) => l.id === lessonId);
  if (!f || !lesson) return <Navigate to={`/m/${m.id}`} replace />;
  return <Player key={lesson.id} f={f} lessonId={lesson.id} moduleTitle={m.title} />;
}

function Player({ f, lessonId, moduleTitle }: { f: Formation; lessonId: string; moduleTitle: string }) {
  const lesson = f.lessons.find((l) => l.id === lessonId)!;
  const li = f.lessons.findIndex((l) => l.id === lessonId);
  const nextLesson = f.lessons[li + 1];
  const steps = lesson.steps;
  const nav = useNavigate();
  const { finishFormationLesson } = useStore();

  const [pos, setPos] = useState(0); // nombre d'étapes affichées
  const [results, setResults] = useState<Record<number, Result>>({});
  const [summary, setSummary] = useState<Summary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const saved = useRef(false);

  const waiting = pos > 0 && isInteractive(steps[pos - 1]) && !results[pos - 1];
  const finished = pos >= steps.length && !waiting;
  const typing = !finished && !waiting;

  const advance = useCallback(() => setPos((p) => Math.min(steps.length, p + 1)), [steps.length]);

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(advance, delayFor(steps[pos]));
    return () => clearTimeout(t);
  }, [typing, pos, steps, advance]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [pos, results, summary, typing]);

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    finishFormationLesson(f, lessonId)
      .then((s) => { setSummary(s); fireConfetti(Boolean(s && s.xp >= 60)); })
      .catch((e) => { setSummary(null); setError(e instanceof Error ? e.message : 'Progression non enregistrée.'); });
  }, [finished, finishFormationLesson, f, lessonId]);

  const answer = (idx: number, r: Result) => setResults((x) => ({ ...x, [idx]: r }));
  const exoCount = steps.filter((s) => s.type === 'exercise' || s.type === 'choice').length;
  const exoOk = Object.values(results).filter((r) => r.ok && r.tries <= 1).length;
  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < steps.length; i++) { const r = results[i]; if (!r) continue; s = r.ok && r.tries <= 1 ? s + 1 : 0; }
    return s;
  }, [results, steps.length]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-2xl flex-col">
      <div className="sticky top-0 z-30 -mx-4 mb-3 bg-bg/90 px-4 pb-2 pt-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link to={`/m/${f.moduleId}/formation/${f.id}`} className="btn btn-ghost !p-2" aria-label="Retour au parcours"><ArrowLeft size={18} /></Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold text-muted">{moduleTitle} · {f.title}</p>
            <p className="truncate font-display text-base font-extrabold"><AnimatedEmoji emoji={lesson.emoji} /> Leçon {li + 1}/{f.lessons.length} - {lesson.title}</p>
          </div>
          {streak >= 2 && <span key={streak} className="chip animate-pop bg-gold/30 text-ink"><AnimatedEmoji emoji="🔥" /> x{streak}</span>}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(Math.min(pos, steps.length) / steps.length) * 100}%`, background: f.color }} />
        </div>
      </div>

      <div className="flex-1 space-y-3.5 pb-6">
        {steps.slice(0, pos).map((s, i) => {
          const prevCoach = i > 0 && steps[i - 1].type !== 'choice' && steps[i - 1].type !== 'exercise';
          return <StepView key={i} s={s} showAvatar={!prevCoach} color={f.color} result={results[i]} onResult={(r) => answer(i, r)} />;
        })}
        {typing && (
          <button type="button" onClick={advance} className="block text-left" aria-label="Accélérer">
            <CoachBubble typing color={f.color} avatar />
          </button>
        )}

        {finished && (
          <div className="rise-in card relative overflow-hidden p-6 text-center" style={{ background: `linear-gradient(160deg, ${f.color}30, transparent 70%)` }}>
            <div className="mx-auto w-fit"><GlassesCloud size={120} color={f.color} /></div>
            <h2 className="h-display text-2xl">Leçon terminée ! <AnimatedEmoji emoji="🎉" /></h2>
            <p className="mt-1 font-semibold text-muted">{exoCount > 0 && <>Du premier coup : <b className="text-ink">{exoOk}/{exoCount}</b>. </>}Chaque erreur t’a appris quelque chose.</p>
            {summary === undefined && !error && <p className="mt-3"><TypingDots /></p>}
            {summary && (
              <div className="mx-auto mt-4 w-fit rounded-2xl bg-card px-5 py-3 shadow-card animate-pop">
                <p className="font-display text-3xl font-extrabold text-brand">+{summary.xp} XP</p>
                {summary.lines.map((l) => <p key={l.label} className="text-xs font-bold text-muted">{l.label} · +{l.xp}</p>)}
                {summary.levelUp && <p className="mt-1 text-sm font-extrabold text-gold"><AnimatedEmoji emoji="⬆️" /> Niveau {summary.newLevel} !</p>}
              </div>
            )}
            {summary === null && !error && <p className="mt-3 text-sm font-bold text-muted">{renderWithAnimatedEmojis('Leçon déjà validée : rien de plus à gagner, mais la révision, ça ne fait jamais de mal 😉')}</p>}
            {error && <p className="mt-3 text-sm font-bold text-bad">{error}</p>}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {nextLesson ? (
                <button type="button" className="btn btn-primary btn-lg shine-sweep" onClick={() => nav(`/m/${f.moduleId}/formation/${f.id}/${nextLesson.id}`)}>
                  Leçon suivante <ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-lg shine-sweep" onClick={() => nav(`/m/${f.moduleId}/formation/${f.id}`)}><AnimatedEmoji emoji="🎓" /> Voir mon parcours</button>
              )}
              <Link to={`/m/${f.moduleId}`} className="btn btn-soft">Retour au module</Link>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>
    </div>
  );
}

function CodeBlock({ title, sql }: { title?: string; sql: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#141B2D] shadow-card">
      <div className="flex items-center justify-between bg-white/5 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        <span>{title ?? 'SQL'}</span>
        <button type="button" className="rounded px-2 py-0.5 hover:bg-white/10" onClick={() => { void navigator.clipboard?.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed text-slate-100"><code>{sql}</code></pre>
    </div>
  );
}

function StepView({ s, showAvatar, color, result, onResult }: {
  s: FormationStep; showAvatar: boolean; color: string; result?: Result; onResult: (r: Result) => void;
}) {
  if (s.type === 'say') return <CoachBubble text={s.text} avatar={showAvatar} color={color} />;
  if (s.type === 'code') {
    return (
      <div className="bubble-in ml-[3.4rem] space-y-1.5">
        <CodeBlock title={s.title ?? s.lang} sql={s.sql} />
        {s.note && <p className="px-1 text-xs font-bold text-muted">{s.note}</p>}
      </div>
    );
  }
  if (s.type === 'choice') return <ChoiceView s={s} color={color} result={result} onResult={onResult} />;
  return <ExerciseView s={s} color={color} result={result} onResult={onResult} />;
}

function ChoiceView({ s, color, result, onResult }: { s: Extract<FormationStep, { type: 'choice' }>; color: string; result?: Result; onResult: (r: Result) => void }) {
  return (
    <div className="bubble-in space-y-2.5">
      <CoachBubble avatar={false} color={color} text={`🎯 **${s.q}**`} />
      <div className="ml-[3.4rem] grid gap-2">
        {s.options.map((o, i) => {
          const picked = result?.picked === i;
          const good = result && i === s.answer;
          return (
            <button
              key={i} type="button" disabled={Boolean(result)}
              onClick={() => onResult({ ok: i === s.answer, picked: i, tries: 1 })}
              className={`rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-bold transition ${good ? 'border-good bg-good/15' : picked ? 'animate-shake border-bad bg-bad/10' : 'border-line bg-card hover:-translate-y-0.5 hover:border-brand'} ${result && !good && !picked ? 'opacity-50' : ''}`}
            >
              <span className="mr-2 font-mono text-xs text-muted">{String.fromCharCode(65 + i)}</span>{o}
              {good && <Check size={16} className="float-right mt-0.5 text-good" />}
              {picked && !good && <X size={16} className="float-right mt-0.5 text-bad" />}
            </button>
          );
        })}
      </div>
      {result && <CoachBubble color={color} avatar={false} text={`${result.ok ? '✅ **Exact !** ' : '💡 **Pas tout à fait.** '}${s.explain}`} />}
    </div>
  );
}

function ExerciseView({ s, color, result, onResult }: { s: Extract<FormationStep, { type: 'exercise' }>; color: string; result?: Result; onResult: (r: Result) => void }) {
  const [text, setText] = useState('');
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const accepted = useMemo(() => new Set([s.solution, ...s.accept].map(s.caseSensitive ? normalizeShell : normalizeSql)), [s]);

  const check = () => {
    if (!text.trim()) { setMsg('Écris ta requête d’abord 😉'); return; }
    const t = tries + 1;
    setTries(t);
    if (accepted.has((s.caseSensitive ? normalizeShell : normalizeSql)(text))) { onResult({ ok: true, tries: t, text }); fireConfetti(false); return; }
    setMsg(t >= 2 ? 'Pas encore. Prends un indice, ou regarde la solution si tu bloques.' : 'Presque ? Relis l’énoncé, vérifie chaque détail (ponctuation, noms, valeurs).');
    if (hints < s.hints.length && t >= 1) setHints((h) => Math.max(h, 1));
  };
  const giveUp = () => onResult({ ok: false, tries: Math.max(tries, 1), text });

  return (
    <div className="bubble-in space-y-2.5">
      <CoachBubble avatar={false} color={color}>
        <Inline text={`🛠️ **À toi de jouer :** ${s.q}`} />
        {s.table && <pre className="mt-2 overflow-x-auto rounded-xl bg-soft p-2.5 font-mono text-[11.5px] leading-snug">{s.table}</pre>}
      </CoachBubble>
      <div className="ml-[3.4rem] space-y-2">
        {!result ? (
          <>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)} rows={4} spellCheck={false} autoCapitalize="off" autoCorrect="off"
              placeholder={s.placeholder ?? 'Écris ta requête SQL ici…'}
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') check(); }}
              className="w-full resize-y rounded-2xl border-2 border-line bg-[#141B2D] p-3 font-mono text-[13px] text-slate-100 outline-none transition focus:border-brand"
            />
            {s.hints.slice(0, hints).map((h, i) => <p key={i} className="bubble-in rounded-2xl bg-gold/20 px-3.5 py-2 text-sm font-bold"><AnimatedEmoji emoji="💡" /> Indice {i + 1} : {renderWithAnimatedEmojis(h)}</p>)}
            {msg && <p className="text-sm font-bold text-muted">{renderWithAnimatedEmojis(msg)}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={check} className="btn btn-primary">Vérifier ✓</button>
              {hints < s.hints.length && <button type="button" onClick={() => setHints((h) => h + 1)} className="btn btn-soft"><AnimatedEmoji emoji="💡" /> Un indice</button>}
              {tries >= 2 && <button type="button" onClick={giveUp} className="btn btn-ghost">Voir la solution</button>}
            </div>
          </>
        ) : (
          <>
            <UserBubble className="whitespace-pre-wrap font-mono text-xs">{result.text?.trim() || '(abandon)'}</UserBubble>
            {!result.ok && <CodeBlock title="Solution" sql={s.solution} />}
          </>
        )}
      </div>
      {result && (
        <CoachBubble color={color} avatar={false} text={`${result.ok ? (result.tries <= 1 ? '🎉 **Du premier coup, bravo !** ' : '✅ **Bien joué, tu y es arrivé !** ') : '👀 **Voilà la solution.** Compare avec la tienne : '}${s.explain}`} />
      )}
    </div>
  );
}
