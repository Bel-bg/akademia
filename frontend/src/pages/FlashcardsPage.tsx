import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, Check, Cross, Sparkles } from '@getpapillon/papicons';
import { Inline } from '@/components/Markdown';
import SummaryCard from '@/components/SummaryCard';
import { Bar, PageTitle, Spinner } from '@/components/ui';
import { getModule, loadCards } from '@/lib/content';
import { dueCardIds, knownCardIds } from '@/lib/progress';
import type { Flashcard, Summary } from '@/lib/types';
import { cn, shuffle } from '@/lib/utils';
import { useStore } from '@/state/Store';
import { Mascot } from '@/components/Mascot';

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

  useEffect(() => {
    if (m) loadCards(m.id).then(setCards);
  }, [m]);
  const tags = useMemo(() => Array.from(new Set((cards ?? []).map((c) => c.tag))), [cards]);

  if (!m) return <Navigate to="/modules" replace />;
  if (!cards) return <Spinner />;

  const due = new Set(dueCardIds(state, m.id));
  const mastered = knownCardIds(state, m.id);

  const begin = (list: Flashcard[]) => {
    setDeck(shuffle(list).slice(0, 20));
    setI(0);
    setFlip(false);
    setKnown([]);
    setUnknown([]);
    setSum(null);
  };

  const rate = async (ok: boolean) => {
    if (!deck) return;
    const c = deck[i];
    const k = ok ? [...known, c.id] : known;
    const u = ok ? unknown : [...unknown, c.id];
    setKnown(k);
    setUnknown(u);
    if (i + 1 >= deck.length) {
      try {
        setSum(await finishCards({ moduleId: m.id, known: k, unknown: u }));
      } catch (error) {
        setKnown(known);
        setUnknown(unknown);
        window.alert(
          error instanceof Error ? error.message : 'Impossible d’enregistrer la série.',
        );
      }
    } else {
      setI(i + 1);
      setFlip(false);
    }
  };

  if (sum)
    return (
      <SummaryCard
        s={sum}
        title="Cartes mémoire"
        mentionOn={false}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-lg flex-1"
              onClick={() => {
                setDeck(null);
                setSum(null);
              }}
            >
              Nouvelle série
            </button>
            <Link to={`/m/${m.id}`} className="btn btn-soft btn-lg">
              Module
            </Link>
          </>
        }
      />
    );

  if (deck) {
    const c = deck[i];
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="chip tabular-nums">
            {i + 1}/{deck.length}
          </span>
          <Bar value={i / deck.length} h={10} />
        </div>

        <button
          type="button"
          onClick={() => setFlip((f) => !f)}
          className="card relative flex min-h-[290px] w-full flex-col items-center justify-center p-8 text-center transition hover:shadow-pop"
          aria-label="Retourner la carte"
        >
          <Mascot
            mood={flip ? 'happy' : 'thinking'}
            size={68}
            animate={false}
            className="mb-2"
          />
          <span className="mb-2 rounded-full bg-soft px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-brand">
            {flip ? 'Réponse' : c.tag}
          </span>
          <div className={cn('text-xl leading-snug', flip ? 'font-semibold' : 'font-display font-extrabold text-2xl')}>
            <Inline text={flip ? c.back : c.front} />
          </div>
          {!flip && (
            <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-extrabold text-muted">
              <Sparkles size={14} className="text-brand" /> Touche la carte pour voir la réponse
            </span>
          )}
        </button>

        {flip ? (
          <div className="mt-4 grid grid-cols-2 gap-3 animate-fadeIn">
            <button
              type="button"
              className="btn btn-lg bg-bad/15 text-bad shadow-[0_4px_0_0_rgba(239,68,68,0.25)]"
              onClick={() => rate(false)}
            >
              <Cross size={18} /> À revoir
            </button>
            <button type="button" className="btn btn-good btn-lg" onClick={() => rate(true)}>
              <Check size={18} /> Je savais
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-lg mt-4 w-full"
            onClick={() => setFlip(true)}
          >
            Montrer la réponse
          </button>
        )}
      </div>
    );
  }

  const pool = cards.filter((c) => !tag || c.tag === tag);
  return (
    <>
      <PageTitle
        title="Cartes mémoire"
        sub={`${m.title} · ${cards.length} cartes · ${mastered.size} maîtrisées`}
        icon={<Card size={30} />}
      />
      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag('')}
            className={cn('chip !py-1.5 !text-xs', !tag && 'bg-brand text-white')}
          >
            Tous les thèmes ({cards.length})
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={cn('chip !py-1.5 !text-xs', tag === t && 'bg-brand text-white')}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => begin(pool)}>
            Lancer une série de 20 cartes
          </button>
          <button
            type="button"
            className="btn btn-soft btn-lg"
            disabled={!due.size}
            onClick={() => begin(cards.filter((c) => due.has(c.id)))}
          >
            À revoir aujourd’hui ({due.size})
          </button>
        </div>
      </div>
    </>
  );
}
