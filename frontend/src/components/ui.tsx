import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Mascot, MascotMood } from './Mascot';
import Loader from './Loader';
import { renderWithAnimatedEmojis } from './AnimatedEmoji';
export { Loader };

export function Ring({
  value,
  size = 64,
  stroke = 8,
  color = 'rgb(var(--brand))',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Bar({
  value,
  color = 'rgb(var(--brand))',
  h = 10,
  className,
}: {
  value: number;
  color?: string;
  h?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-soft', className)} style={{ height: h }}>
      <div
        className="relative h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      >
        {pct > 8 && (
          <span className="absolute inset-x-2 top-[2px] h-[25%] rounded-full bg-white/30" />
        )}
      </div>
    </div>
  );
}

export function Spinner({ label = 'Chargement…', size = '4.5rem' }: { label?: string; size?: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-muted" role="status">
      <Loader size={size} />
      <span className="font-display text-base font-extrabold text-ink animate-pulse">{label}</span>
    </div>
  );
}

export function Empty({
  mood = 'sleepy',
  title,
  children,
}: {
  mood?: MascotMood;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Mascot mood={mood} size={112} />
      <h3 className="h-display text-xl">{renderWithAnimatedEmojis(title)}</h3>
      {children && <div className="max-w-md text-sm font-semibold text-muted">{children}</div>}
    </div>
  );
}

export function PageTitle({
  title,
  sub,
  right,
  icon,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h-display flex items-center gap-2.5 text-3xl sm:text-4xl">
          {icon && <span className="inline-flex items-center text-brand">{icon}</span>}
          <span>{renderWithAnimatedEmojis(title)}</span>
        </h1>
        {sub && <p className="mt-1 text-sm font-semibold text-muted">{renderWithAnimatedEmojis(sub)}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center p-4 text-center sm:items-start sm:text-left">
      <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
        {icon && <span className="text-brand">{icon}</span>}
        {label}
      </div>
      <div className="h-display mt-1 text-2xl sm:text-3xl">{value}</div>
      {sub && <div className="text-xs font-semibold text-muted">{sub}</div>}
    </div>
  );
}
