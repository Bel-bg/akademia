import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, RotateCw, X } from 'lucide-react';
import { Inline } from '@/components/Markdown';
import SummaryCard from '@/components/SummaryCard';
import { Bar, PageTitle, Spinner } from '@/components/ui';
import { getModule, loadCards } from '@/lib/content';
import { dueCardIds, knownCardIds } from '@/lib/progress';
import type { Flashcard, Summary } from '@/lib/types';
import { cn, shuffle } from '@/lib/utils';
import { useStore } from '@/state/Store';

export default function FlashcardsPage() {
  const { moduleId } = useParams();
  const m = getModule(moduleId);
  const { state, finishCards } = useStore();
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [deck, setDeck] = useState<Flashcard[] | null>(null);
  const [tag, setTag] = useState('');
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);

  useEffect(() => { if (m) loadCards(m.id).then(setCards); }, [m]);
  const tags = useMemo(() => Array.from(new Set((cards ?? []).map((c) => c.tag))), [cards]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!cards) return <Spinner />;

  const due = new Set(dueCardIds(state, m.id));
  const mastered = knownCardIds(state, m.id);

  const begin = (list: Flashcard[]) => {
    setDeck(shuffle(list).slice(0, 20)); setI(0); setFlip(false); setKnown([]); setUnknown([]); setSum(null);
  };
  const rate = (ok: boolean) => {
    if (!deck) return;
    const c = deck[i];
    const k = ok ? [...known, c.id] : known;
    const u = ok ? unknown : [...unknown, c.id];
    setKnown(k); setUnknown(u);
    if (i + 1 >= deck.length) setSum(finishCards({ moduleId: m.id, known: k, unknown: u }));
    else { setI(i + 1); setFlip(false); }
  };

  if (sum)
    return <SummaryCard s={sum} title="Cartes mémoire" mentionOn={false} actions={<><button className="btn btn-primary" onClick={() => { setDeck(null); setSum(null); }}>Nouvelle série</button><Link to={`/m/${m.id}`} className="btn btn-soft">Retour au module</Link></>} />;

  if (deck) {
    const c = deck[i];
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center gap-3"><span className="chip tabular-nums">{i + 1}/{deck.length}</span><Bar value={i / deck.length} /></div>
        <button onClick={() => setFlip((f) => !f)} className="card flex min-h-[260px] w-full flex-col items-center justify-center p-8 text-center transition hover:shadow-pop" aria-label="Retourner la carte">
          <span className="mb-3 text-xs font-extrabold uppercase tracking-widest text-muted">{flip ? 'Réponse' : c.tag}</span>
          <div className={cn('text-xl leading-snug', flip ? 'font-medium' : 'font-bold')}><Inline text={flip ? c.back : c.front} /></div>
          {!flip && <span className="mt-5 flex items-center gap-1 text-xs text-muted"><RotateCw size={12} /> Touche pour retourner</span>}
        </button>
        {flip ? (
          <div className="mt-4 grid grid-cols-2 gap-3 animate-fadeIn">
            <button className="btn btn-lg bg-bad/15 text-bad" onClick={() => rate(false)}><X size={18} /> À revoir</button>
            <button className="btn btn-good btn-lg" onClick={() => rate(true)}><Check size={18} /> Je savais</button>
          </div>
        ) : (
          <button className="btn btn-soft btn-lg mt-4 w-full" onClick={() => setFlip(true)}>Montrer la réponse</button>
        )}
      </div>
    );
  }

  const pool = cards.filter((c) => !tag || c.tag === tag);
  return (
    <>
      <PageTitle title="Cartes mémoire" sub={`${m.title} · ${cards.length} cartes · ${mastered.size} en cours d'apprentissage`} emoji="🃏" />
      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTag('')} className={cn('chip !text-sm', !tag && 'border-brand bg-brand text-white')}>Tout</button>
          {tags.map((t) => <button key={t} onClick={() => setTag(t)} className={cn('chip !text-sm', tag === t && 'border-brand bg-brand text-white')}>{t}</button>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn btn-primary btn-lg" onClick={() => begin(pool)}>Série de 20 cartes</button>
          <button className="btn btn-soft btn-lg" disabled={!due.size} onClick={() => begin(cards.filter((c) => due.has(c.id)))}>À revoir aujourd'hui ({due.size})</button>
        </div>
      </div>
    </>
  );
}
