import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star } from '@getpapillon/papicons';
import { mention } from '@/lib/gamification';
import type { Summary } from '@/lib/types';
import { fmtScore } from '@/lib/utils';
import { Mascot } from './Mascot';
import { ConfettiBackdrop, FlameBadgeIcon, HexStarMedal } from './Decor';
import { fireConfetti } from './Celebrations';

export default function SummaryCard({
  s,
  title,
  unit = '',
  actions,
  mentionOn = true,
}: {
  s: Summary;
  title: string;
  unit?: string;
  actions?: ReactNode;
  mentionOn?: boolean;
}) {
  const m = mention(s.score, s.max);

  useEffect(() => {
    if (s.xp > 0) fireConfetti(s.xp >= 40);
  }, [s.xp]);

  return (
    <div className="relative mx-auto max-w-md overflow-hidden rounded-4xl bg-bg px-4 py-6 text-center animate-pop">
      <ConfettiBackdrop />

      <div className="relative z-10 flex flex-col items-center">
        <HexStarMedal size={68} />

        <Mascot mood="excited" eyelashes size={185} className="-my-2" />

        {/* Carte centrale "+75 XP · Bravo champion !" fidèle aux 4 maquettes */}
        <div className="card w-full p-6 shadow-pop">
          <div className="h-display text-5xl text-ink">+{s.xp} XP</div>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-lg font-extrabold text-muted">
            <span>{mentionOn ? `Bravo champion ! (${m.label})` : 'Bravo champion !'}</span>
            <FlameBadgeIcon size={22} />
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 text-xs font-extrabold text-ink">
            <span>{title} :</span>
            <span className="text-brand">
              {fmtScore(s.score)} / {fmtScore(s.max)}
              {unit}
            </span>
          </div>

          {s.lines.length > 0 && (
            <div className="mt-4 space-y-1 rounded-2xl bg-soft/65 p-3.5 text-left text-xs font-bold">
              {s.lines.map((l, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted">{l.label}</span>
                  <span className="font-extrabold text-good">+{l.xp} XP</span>
                </div>
              ))}
              <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5 text-sm font-extrabold text-ink">
                <span className="flex items-center gap-1">
                  <Sparkles size={15} className="text-brand" /> Total gagné
                </span>
                <span className="text-brand">+{s.xp} XP</span>
              </div>
            </div>
          )}

          {s.levelUp && (
            <p className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gold/25 py-1 text-xs font-extrabold text-ink">
              <Star size={14} className="text-brand" />
              <span>Niveau {s.newLevel} atteint !</span>
            </p>
          )}
        </div>

        <div className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          {actions}
        </div>
        <Link to="/" className="mt-4 inline-block text-xs font-extrabold text-muted underline hover:text-ink">
          Continuer vers l'accueil
        </Link>
      </div>
    </div>
  );
}
