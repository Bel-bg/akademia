import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { mention } from '@/lib/gamification';
import type { Summary } from '@/lib/types';
import { fmtScore } from '@/lib/utils';
import { ReactNode } from 'react';

export default function SummaryCard({ s, title, unit = '', actions, mentionOn = true }: { s: Summary; title: string; unit?: string; actions?: ReactNode; mentionOn?: boolean }) {
  const m = mention(s.score, s.max);
  return (
    <div className="card mx-auto max-w-xl animate-pop p-7 text-center">
      <div className="text-6xl">{mentionOn ? m.emoji : '🎉'}</div>
      <p className="mt-3 text-xs font-extrabold uppercase tracking-widest text-muted">{title}</p>
      <h2 className="h-display mt-1 text-5xl">
        {fmtScore(s.score)}<span className="text-2xl text-muted"> / {fmtScore(s.max)}{unit}</span>
      </h2>
      {mentionOn && <p className="mt-1 font-bold text-brand">{m.label}</p>}
      <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-soft p-4 text-left text-sm">
        {s.lines.map((l, i) => (
          <div key={i} className="flex justify-between py-0.5"><span>{l.label}</span><b className="text-good">+{l.xp}</b></div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-base font-extrabold">
          <span className="flex items-center gap-1"><Zap size={15} className="text-accent" /> Total</span>
          <span className="text-accent">+{s.xp} XP</span>
        </div>
      </div>
      {s.levelUp && <p className="mt-3 text-sm font-bold text-accent">⬆️ Niveau {s.newLevel} atteint !</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
      <Link to="/" className="mt-4 inline-block text-sm text-muted underline">Retour à l'accueil</Link>
    </div>
  );
}
