import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { badgeById, RARITY_STYLE, tierFor } from '@/lib/gamification';
import { useStore } from '@/state/Store';

export function fireConfetti(big = false) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const colors = ['#7B6CFF', '#FFB020', '#12B76A', '#F04438', '#38BDF8'];
  confetti({ particleCount: big ? 160 : 70, spread: big ? 100 : 70, origin: { y: 0.65 }, colors });
  if (big) setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors }), 220);
  if (big) setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors }), 220);
}

/** Affiche, un par un, les passages de niveau et badges débloqués. */
export default function Celebrations() {
  const { events, dismissEvent } = useStore();
  const ev = events[0];

  useEffect(() => {
    if (!ev) return;
    if (ev.type === 'level') fireConfetti(true);
    if (ev.type === 'badge') fireConfetti(false);
  }, [ev]);

  if (!ev) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="card w-full max-w-sm animate-pop p-7 text-center shadow-pop">
        {ev.type === 'level' && (() => {
          const t = tierFor(ev.level);
          return (
            <>
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl" style={{ background: t.color + '2a' }}>{t.emoji}</div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-accent">Niveau supérieur !</p>
              <h2 className="h-display mt-1 text-4xl">Niveau {ev.level}</h2>
              <p className="mt-2 text-muted">Palier de puissance : <b className="text-ink">{t.name}</b></p>
            </>
          );
        })()}
        {ev.type === 'badge' && (() => {
          const b = badgeById(ev.id);
          if (!b) return null;
          return (
            <>
              <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-5xl shadow-pop ${RARITY_STYLE[b.rarity]}`}>{b.emoji}</div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-accent">Nouveau badge · {b.rarity}</p>
              <h2 className="h-display mt-1 text-2xl">{b.name}</h2>
              <p className="mt-2 text-muted">{b.desc}</p>
              <p className="mt-2 text-sm font-bold text-good">+20 XP</p>
            </>
          );
        })()}
        <button autoFocus className="btn btn-primary btn-lg mt-6 w-full" onClick={dismissEvent}>
          {events.length > 1 ? 'Suivant' : 'Continuer'}
        </button>
      </div>
    </div>
  );
}
