import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Tasks } from '@getpapillon/papicons';
import { Course } from '@/components/Markdown';
import { Spinner } from '@/components/ui';
import { chapterNeighbors, getChapter, getModule, loadChapter } from '@/lib/content';
import { cn } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';
import { ConfettiBackdrop, HexStarMedal } from '@/components/Decor';
import { fireConfetti } from '@/components/Celebrations';
import { renderWithAnimatedEmojis } from '@/components/AnimatedEmoji';

interface Head {
  id: string;
  text: string;
  level: number;
}

export default function ChapterPage() {
  const { moduleId, chapterId } = useParams();
  const m = getModule(moduleId);
  const c = m ? getChapter(m, chapterId) : undefined;
  const nav = useNavigate();
  const { state, chapterRead } = useStore();
  const [text, setText] = useState<string | null>(null);
  const [heads, setHeads] = useState<Head[]>([]);
  const [active, setActive] = useState('');
  const [progress, setProgress] = useState(0);
  const [big, setBig] = useState(() => {
    try {
      return localStorage.getItem('akademia:reader') === 'lg';
    } catch {
      return false;
    }
  });
  const [gained, setGained] = useState<number | null>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!m || !c) return;
    setText(null);
    setGained(null);
    window.scrollTo(0, 0);
    let live = true;
    loadChapter(m.id, c.file).then((t) => live && setText(t));
    return () => {
      live = false;
    };
  }, [m, c]);

  useEffect(() => {
    if (text === null || !body.current) return;
    const hs = Array.from(body.current.querySelectorAll('h2, h3'))
      .filter((h) => h.id)
      .map((h) => ({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H2' ? 2 : 3 }));
    setHeads(hs);
  }, [text]);

  useEffect(() => {
    const onScroll = () => {
      const el = body.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setProgress(total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 1);
      let cur = '';
      for (const h of heads) {
        const e = document.getElementById(h.id);
        if (e && e.getBoundingClientRect().top < 120) cur = h.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [heads, text]);

  if (!m || !c) return <Navigate to="/modules" replace />;
  const { prev, next } = chapterNeighbors(m, c.id);
  const done = (state.chaptersRead[m.id] ?? []).includes(c.id);

  const toggleSize = (v: boolean) => {
    setBig(v);
    try {
      localStorage.setItem('akademia:reader', v ? 'lg' : 'sm');
    } catch {
      /* ignore */
    }
  };

  const markRead = async () => {
    try {
      const result = await chapterRead(m.id, c.id);
      if (result) {
        setGained(result.xp);
        fireConfetti(false);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible d’enregistrer ce chapitre.');
    }
  };

  return (
    <div>
      {/* Barre de progression de lecture en haut */}
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-transparent lg:pl-72">
        <div
          className="h-full rounded-r-full bg-brand transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/m/${m.id}`} className="btn btn-soft !px-3.5 !py-1.5 text-xs">
          <ArrowLeft size={15} /> {m.title}
        </Link>
        <div
          className="flex items-center gap-1 rounded-full bg-card px-2 py-1 shadow-sm"
          role="group"
          aria-label="Taille du texte"
        >
          <button
            type="button"
            className="btn btn-ghost !p-1.5"
            onClick={() => toggleSize(false)}
            aria-label="Texte plus petit"
          >
            <Minus size={15} />
          </button>
          <span className="px-1 text-xs font-extrabold text-muted">Aa</span>
          <button
            type="button"
            className="btn btn-ghost !p-1.5"
            onClick={() => toggleSize(true)}
            aria-label="Texte plus grand"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0">
          <header className="card mb-6 p-6">
            <span
              className="inline-block rounded-full px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-white"
              style={{ background: m.color }}
            >
              Chapitre {c.number} · {c.minutes} min de lecture
            </span>
            <h1 className="h-display mt-2 text-3xl sm:text-4xl">{renderWithAnimatedEmojis(c.title)}</h1>
            <p className="mt-1.5 font-semibold text-muted">{renderWithAnimatedEmojis(c.summary)}</p>
          </header>

          <div ref={body} className={cn('card p-5 sm:p-8', big ? 'reader-lg' : 'reader-sm')}>
            {text === null ? <Spinner /> : <Course text={text} />}
          </div>

          {text !== null && (
            <div className="card relative mt-6 overflow-hidden p-6 text-center">
              {done || gained !== null ? (
                <div className="relative z-10 flex flex-col items-center">
                  {gained !== null && <ConfettiBackdrop />}
                  <HexStarMedal size={56} />
                  <Mascot mood="excited" eyelashes size={130} className="-my-2" />
                  <p className="h-display text-2xl font-extrabold text-good">
                    Chapitre validé{gained ? ` · +${gained} XP !` : ' !'}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                    {m.features.quiz && (
                      <Link to={`/m/${m.id}/qcm?chap=${c.id}`} className="btn btn-soft">
                        <Tasks size={16} /> Teste-toi sur ce chapitre
                      </Link>
                    )}
                    {next && (
                      <Link to={`/m/${m.id}/lire/${next.id}`} className="btn btn-primary">
                        Chapitre suivant <ArrowRight size={16} />
                      </Link>
                    )}
                    {!next && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => nav(`/m/${m.id}`)}
                      >
                        Retour au module
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mascot mood="happy" size={115} className="-mt-2" />
                  <p className="font-display text-lg font-extrabold text-ink">
                    Tu as terminé la lecture de ce chapitre ?
                  </p>
                  <button type="button" className="btn btn-good btn-lg mt-3" onClick={markRead}>
                    <Check size={18} /> Marquer comme lu (+25 XP)
                  </button>
                </div>
              )}
            </div>
          )}

          <nav className="mt-6 flex justify-between gap-3">
            {prev ? (
              <Link to={`/m/${m.id}/lire/${prev.id}`} className="btn btn-soft">
                <ArrowLeft size={16} /> {prev.number} {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/m/${m.id}/lire/${next.id}`} className="btn btn-soft">
                {next.number} {next.title} <ArrowRight size={16} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-muted">
              Dans ce chapitre
            </p>
            <ul className="space-y-1 border-l-2 border-line">
              {heads.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById(h.id)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={cn(
                      '-ml-0.5 block border-l-2 py-1 pr-2 text-xs leading-snug transition',
                      h.level === 3 ? 'pl-5' : 'pl-3',
                      active === h.id
                        ? 'border-brand font-extrabold text-brand'
                        : 'border-transparent font-semibold text-muted hover:text-ink',
                    )}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
