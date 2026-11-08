import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { badgeById, tierFor } from '@/lib/gamification';
import { useStore } from '@/state/Store';
import { Mascot } from './Mascot';
import { ConfettiBackdrop, FlameBadgeIcon, HexStarMedal } from './Decor';

export function fireConfetti(big = false) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const colors = ['#1D6FFF', '#FF574A', '#18B8E8', '#7C3AED', '#FFD026', '#22C55E'];
  confetti({ particleCount: big ? 140 : 65, spread: big ? 100 : 70, origin: { y: 0.62 }, colors });
  if (big) {
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors }), 200);
  }
}

/**
 * Affiche, un par un, les passages de niveau et badges débloqués dans un <dialog> natif
 * au style Playful Gamified EdTech (médaillon hexagonal étoilé + mascotte nuage + confettis).
 */
export default function Celebrations() {
  const { events, dismissEvent } = useStore();
  const ev = events[0];
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (ev) {
      if (!dlg.open) dlg.showModal();
      if (ev.type === 'level') fireConfetti(true);
      if (ev.type === 'badge') fireConfetti(false);
    } else if (dlg.open) {
      dlg.close();
    }
  }, [ev]);

  if (!ev) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="celebration-title"
      onClose={dismissEvent}
      className="m-auto w-[calc(100%-2rem)] max-w-sm overflow-visible rounded-4xl border-0 bg-bg p-6 text-center text-ink shadow-pop outline-none animate-pop"
    >
      <div className="relative flex flex-col items-center pt-2">
        <ConfettiBackdrop />

        <HexStarMedal size={68} className="relative z-10 mb-1" />

        <Mascot
          mood={ev.type === 'level' ? 'proud' : 'excited'}
          crown={ev.type === 'level'}
          eyelashes={ev.type === 'badge'}
          size={170}
          className="relative z-10 -my-2"
        />

        <div className="card relative z-10 mt-1 w-full p-6 shadow-card">
          {ev.type === 'level' && (() => {
            const t = tierFor(ev.level);
            return (
              <>
                <p className="text-xs font-extrabold uppercase tracking-widest text-brand">Niveau supérieur !</p>
                <h2 id="celebration-title" className="h-display mt-1 text-4xl text-ink">
                  Niveau {ev.level}
                </h2>
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-base font-bold text-muted">
                  Palier : <span className="font-extrabold text-ink">{t.name}</span>
                  <FlameBadgeIcon size={20} />
                </p>
              </>
            );
          })()}

          {ev.type === 'badge' && (() => {
            const b = badgeById(ev.id);
            if (!b) return null;
            return (
              <>
                <p className="text-xs font-extrabold uppercase tracking-widest text-brand">
                  Nouveau badge · {b.rarity}
                </p>
                <h2 id="celebration-title" className="h-display mt-1 text-3xl text-ink">
                  +20 XP
                </h2>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-base font-extrabold text-ink">
                  {b.name} <FlameBadgeIcon size={18} />
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">{b.desc}</p>
              </>
            );
          })()}
        </div>

        <button
          type="button"
          autoFocus
          className="btn btn-primary btn-lg relative z-10 mt-5 w-full"
          onClick={dismissEvent}
        >
          {events.length > 1 ? 'Suivant' : 'Continuer'}
        </button>
      </div>
    </dialog>
  );
}
