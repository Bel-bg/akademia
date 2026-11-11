import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, Cross as X } from '@getpapillon/papicons';
import type { Formation, ModuleMeta } from '@/lib/types';
import { useStore } from '@/state/Store';
import { GlassesCloud } from './GlassesCloud';
import { CoachBubble, UserBubble } from './CoachBubble';
import { FourPointStar } from './Decor';
import { AnimatedEmoji } from './AnimatedEmoji';
import { FormationShareAction } from './FormationShareModal';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const typingTime = (t: string) => Math.min(1700, 650 + t.length * 13);

export function formationProgress(done: string[] | undefined, f: Formation) {
  const n = f.lessons.filter((l) => done?.includes(l.id)).length;
  return { n, total: f.lessons.length, pct: f.lessons.length ? n / f.lessons.length : 0 };
}

/** Section « Formations » : le nuage à lunettes annonce un titre, qui change toutes les quelques secondes. */
export default function FormationShowcase({ module: m, formations }: { module: ModuleMeta; formations: Formation[] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { state } = useStore();
  const f = formations[i % formations.length];

  useEffect(() => {
    if (open || formations.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % formations.length), 4200);
    return () => clearInterval(t);
  }, [open, formations.length]);

  const go = (x: Formation) => nav(`/m/${m.id}/formation/${x.id}`);
  const click = () => (formations.length > 1 ? setOpen(true) : go(f));
  const prog = formationProgress(state.formations?.[`${m.id}:${f.id}`], f);

  return (
    <section aria-label="Formations" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="h-display text-2xl">Formations coachées</h2>
          <p className="text-sm font-semibold text-muted">Un sujet précis, un coach, des exercices : tu ressors expert.</p>
        </div>
        <span className="chip bg-gold/25 text-ink">{formations.length} formation{formations.length > 1 ? 's' : ''}</span>
      </div>

      <button
        type="button"
        onClick={click}
        className="card group relative flex w-full flex-col items-center gap-4 overflow-hidden p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop sm:flex-row sm:p-7"
        style={{ background: `linear-gradient(135deg, ${f.color}22, transparent 60%)` }}
        aria-label={`Discuter de la formation ${f.title}`}
      >
        {[['8%', '14%'], ['90%', '20%'], ['78%', '82%'], ['30%', '88%']].map(([l, t], k) => (
          <span key={k} className="twinkle pointer-events-none absolute" style={{ left: l, top: t, animationDelay: `${k * 0.7}s` }}>
            <FourPointStar size={14 + k * 3} color={f.color} />
          </span>
        ))}

        <div className="relative shrink-0">
          <GlassesCloud size={190} color={f.color} />
          <span className="absolute -bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full bg-ink/10 blur-md" />
        </div>

        {/* Bulle d'annonce */}
        <div className="relative min-w-0 flex-1">
          <div className="relative rounded-3xl bg-card px-5 py-4 shadow-card ring-1 ring-line/70 sm:rounded-bl-md">
            <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-card ring-1 ring-line/70 [clip-path:polygon(0_0,100%_0,0_100%)] sm:hidden" />
            <span className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 bg-card sm:block" />
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Nouvelle formation · {f.level} · ~{f.minutes} min
            </p>
            <div key={f.id} className="title-swap">
              <h3 className="h-display mt-1 text-2xl leading-tight sm:text-3xl">
                <AnimatedEmoji emoji={f.emoji} className="mr-1.5" />« {f.title} »
              </h3>
              <p className="mt-1 text-sm font-semibold text-muted">{f.tagline}</p>
            </div>
            {prog.n > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full transition-all" style={{ width: `${prog.pct * 100}%`, background: f.color }} />
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="btn btn-primary shine-sweep glow-pulse">
              <Sparkles size={18} />
              <span>{prog.n > 0 ? 'Reprendre la discussion' : 'Discuter avec Nimbo'}</span>
              <ArrowRight size={16} />
            </span>
            <FormationShareAction
              formation={f}
              moduleTitle={m.title}
              moduleEmoji={m.emoji}
              moduleColor={f.color}
            />
            {formations.length > 1 && (
              <span className="flex items-center gap-1.5" aria-hidden>
                {formations.map((x, k) => (
                  <i key={x.id} className="h-2 rounded-full transition-all" style={{ width: k === i % formations.length ? 22 : 8, background: k === i % formations.length ? f.color : 'rgb(var(--line))' }} />
                ))}
              </span>
            )}
          </div>
        </div>
      </button>

      {open && <FormationChat module={m} formations={formations} startAt={i % formations.length} onClose={() => setOpen(false)} onPick={go} />}
    </section>
  );
}

type Msg = { id: number; who: 'coach' | 'me'; text: string };

/** Discussion d'accueil : Nimbo explique la formation et ses avantages avant de la lancer. */
function FormationChat({ module: m, formations, startAt, onClose, onPick }: {
  module: ModuleMeta; formations: Formation[]; startAt: number; onClose: () => void; onPick: (f: Formation) => void;
}) {
  const [idx, setIdx] = useState(startAt);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [benefits, setBenefits] = useState(0);
  const [ready, setReady] = useState(false);
  const run = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const f = formations[idx];

  const say = useCallback(async (token: number, text: string) => {
    setTyping(true); await wait(typingTime(text));
    if (token !== run.current) return false;
    setTyping(false);
    setMsgs((x) => [...x, { id: x.length + Math.random(), who: 'coach', text }]);
    await wait(260);
    return token === run.current;
  }, []);

  useEffect(() => {
    const token = ++run.current;
    setMsgs([]); setBenefits(0); setReady(false);
    (async () => {
      await wait(250);
      for (const line of f.pitch) { if (!(await say(token, line))) return; }
      for (let k = 1; k <= f.benefits.length; k++) { if (token !== run.current) return; setBenefits(k); await wait(420); }
      if (token !== run.current) return;
      setTyping(true); await wait(700); setTyping(false);
      if (token !== run.current) return;
      setMsgs((x) => [...x, { id: Math.random(), who: 'coach', text: 'Alors, on se lance ensemble ? 😊' }]);
      setReady(true);
    })();
    return () => { run.current++; };
  }, [f, say]);

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [msgs, typing, benefits, ready]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const start = async () => {
    const token = ++run.current;
    setReady(false);
    setMsgs((x) => [...x, { id: Math.random(), who: 'me', text: 'Oui, on commence ! 🚀' }]);
    await wait(500);
    if (token !== run.current) return;
    await say(token, 'Excellent choix ! Installe-toi, c’est parti…');
    await wait(500);
    if (token === run.current) onPick(f);
  };
  const other = async () => {
    const token = ++run.current;
    setReady(false);
    setMsgs((x) => [...x, { id: Math.random(), who: 'me', text: 'Tu as une autre formation ? 👀' }]);
    await wait(450);
    if (token !== run.current) return;
    if (!(await say(token, 'Bien sûr, regarde celle-ci !'))) return;
    await wait(250);
    if (token === run.current) setIdx((idx + 1) % formations.length);
  };

  let coachSeen = false;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Présentation : ${f.title}`}>
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-4xl bg-bg shadow-pop sm:rounded-4xl animate-pop">
        <header className="flex items-center gap-3 border-b border-line/70 px-4 py-3" style={{ background: `linear-gradient(90deg, ${f.color}30, transparent)` }}>
          <GlassesCloud size={52} color={f.color} talking={typing} bob={false} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-none">Nimbo</p>
            <p className="truncate text-xs font-bold text-muted">{typing ? 'écrit…' : `Ton coach · ${m.title}`}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost !p-2" aria-label="Fermer"><X size={20} /></button>
        </header>

        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          <div className="rise-in rounded-3xl p-4 text-center" style={{ background: `${f.color}1f` }}>
            <div className="text-4xl"><AnimatedEmoji emoji={f.emoji} size="2.5rem" /></div>
            <h3 className="h-display text-xl">{f.title}</h3>
            <p className="text-xs font-bold text-muted">{f.lessons.length} leçons · ~{f.minutes} min · {f.level}</p>
          </div>

          {msgs.map((x) => {
            if (x.who === 'me') { coachSeen = false; return <UserBubble key={x.id}>{x.text}</UserBubble>; }
            const first = !coachSeen; coachSeen = true;
            return <CoachBubble key={x.id} text={x.text} avatar={first} color={f.color} />;
          })}

          {benefits > 0 && (
            <div className="ml-[3.4rem] space-y-2">
              {f.benefits.slice(0, benefits).map((b) => (
                <div key={b} className="bubble-in flex items-start gap-2.5 rounded-2xl bg-card px-3.5 py-2.5 text-sm font-bold shadow-card ring-1 ring-line/60">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good text-white"><Check size={13} /></span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
          {typing && <CoachBubble typing avatar={!coachSeen} color={f.color} />}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-line/70 bg-card/70 p-3">
          {ready ? (
            <>
              <button type="button" onClick={start} className="btn btn-primary btn-lg flex-1 shine-sweep rise-in"><AnimatedEmoji emoji="🚀" /> On commence !</button>
              {formations.length > 1 && <button type="button" onClick={other} className="btn btn-soft rise-in"><AnimatedEmoji emoji="👀" /> Une autre formation</button>}
              <FormationShareAction formation={f} moduleTitle={m.title} moduleEmoji={m.emoji} moduleColor={f.color} />
              <button type="button" onClick={onClose} className="btn btn-ghost rise-in">Plus tard</button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between">
              <p className="py-2 text-xs font-bold text-muted">Nimbo te présente la formation…</p>
              <FormationShareAction formation={f} moduleTitle={m.title} moduleEmoji={m.emoji} moduleColor={f.color} />
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
