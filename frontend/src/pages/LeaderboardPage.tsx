import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Filter, Sparkles } from '@getpapillon/papicons';
import { fetchLeaderboard, LeaderRow } from '@/data/repo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';
import { useStore } from '@/state/Store';
import { FiliereId, useTheme } from '@/state/Theme';
import { Mascot } from '@/components/Mascot';
import { CustomAvatar } from '@/components/CustomAvatar';
import { TrophyBadgeIcon } from '@/components/Decor';
import { Spinner } from '@/components/ui';

interface CampusEntry {
  id: string;
  username: string;
  filiere: FiliereId;
  xp: number;
  level: number;
  streak: number;
  isMe?: boolean;
}

function fmtK(xp: number): string {
  if (xp >= 1000) {
    const k = (xp / 1000).toFixed(1);
    return `${k}k XP`;
  }
  return `${xp} XP`;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { state } = useStore();
  const { theme, filiere } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [remoteRows, setRemoteRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard(50)
      .then((rows) => {
        if (alive) setRemoteRows(rows);
      })
      .catch(() => {
        if (alive) setRemoteRows([]);
      });
    return () => {
      alive = false;
    };
  }, [state.xp, filiere]);

  const entries = useMemo<CampusEntry[]>(() => {
    if (!remoteRows) return [];
    const mult = period === 'week' ? 1 : period === 'month' ? 1.4 : 1.9;
    return remoteRows
      .map((r) => ({
        id: r.id,
        username: r.username,
        filiere: r.filiere === 'AIP' ? ('AIP' as const) : ('ARI' as const),
        xp: Math.round(r.xp * (period === 'week' ? 1 : mult)),
        level: r.level,
        streak: r.streak,
        isMe: r.id === user?.id,
      }))
      .sort((a, b) => b.xp - a.xp);
  }, [period, remoteRows, user]);

  if (!remoteRows) return <Spinner label="Chargement du classement…" />;

  const hasPodium = entries.length >= 3;
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const rest = hasPodium ? entries.slice(3) : entries;

  // Couleurs du podium selon le thème (Bleu Ciel vs Violet)
  const podiumColors =
    theme === 'ciel'
      ? {
          c1Mascot: '#1D6FFF',
          c1Bar: 'bg-[#FDE047] text-ink border-[#FACC15]',
          c2Mascot: '#8B5CF6',
          c2Bar: 'bg-[#DDD6FE] text-ink border-[#C4B5FD]',
          c3Mascot: '#22C55E',
          c3Bar: 'bg-[#FEF08A]/70 text-ink border-[#FDE047]',
        }
      : {
          c1Mascot: '#7C3AED',
          c1Bar: 'bg-brand text-white border-brand-deep',
          c2Mascot: '#8B49F7',
          c2Bar: 'bg-soft text-ink border-brand/20',
          c3Mascot: '#8B49F7',
          c3Bar: 'bg-soft text-ink border-brand/20',
        };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* En-tête Leaderboard + Sélecteur de période */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <TrophyBadgeIcon size={34} />
          <h1 className="h-display text-3xl sm:text-4xl">Leaderboard</h1>
        </div>

        <button
          type="button"
          onClick={() =>
            setPeriod((p) => (p === 'week' ? 'month' : p === 'month' ? 'all' : 'week'))
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-xs font-extrabold text-ink shadow-sm transition hover:bg-soft"
        >
          <Filter size={14} className="text-brand" />
          <span>
            {period === 'week'
              ? 'Cette semaine'
              : period === 'month'
                ? 'Ce mois-ci'
                : 'Classement général'}
          </span>
          <ChevronDown size={15} className="text-muted" />
        </button>
      </div>

      {/* ==================== PODIUM TOP 3 AVEC MASCOTTES ==================== */}
      {hasPodium && (
        <section className="relative pt-6">
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
            {/* 2e Place (Gauche) */}
            <Link
              to={top2.isMe ? '/profil' : `/joueurs/${top2.id}`}
              className="flex flex-col items-center group transition transform hover:-translate-y-1"
            >
              <div className="relative -mb-3 z-10 flex flex-col items-center">
                <CustomAvatar name={top2.username} filiere={top2.filiere} size={54} showBadge />
              </div>
              <div
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-t-3xl rounded-b-2xl border-b-4 px-2 py-4 text-center shadow-card transition',
                  podiumColors.c2Bar,
                )}
              >
                <span className="h-display text-3xl font-extrabold text-brand">2</span>
                <span className="mt-1 font-display text-base font-extrabold">{top2.filiere}</span>
                <span className="truncate max-w-[85px] text-[10px] font-bold opacity-75">{top2.username}</span>
                <span className="text-[11px] font-bold opacity-90">{fmtK(top2.xp)}</span>
              </div>
            </Link>

            {/* 1ère Place (Centre, Élevé) */}
            <Link
              to={top1.isMe ? '/profil' : `/joueurs/${top1.id}`}
              className="flex flex-col items-center -mt-6 group transition transform hover:-translate-y-1"
            >
              <div className="relative -mb-3 z-20 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Mascot mood="excited" size={48} />
                  </div>
                  <CustomAvatar name={top1.username} filiere={top1.filiere} size={64} showBadge />
                </div>
              </div>
              <div
                className={cn(
                  'flex min-h-[148px] w-full flex-col items-center justify-center rounded-t-3xl rounded-b-2xl border-b-4 px-2 py-6 text-center shadow-pop transition',
                  podiumColors.c1Bar,
                )}
              >
                <span
                  className={cn(
                    'h-display text-4xl font-extrabold',
                    theme === 'violet' ? 'text-gold' : 'text-brand',
                  )}
                >
                  1
                </span>
                <span className="mt-1 font-display text-lg font-extrabold">{top1.filiere}</span>
                <span className="truncate max-w-[100px] text-xs font-bold opacity-80">{top1.username}</span>
                <span className="text-xs font-extrabold opacity-95">{fmtK(top1.xp)}</span>
              </div>
            </Link>

            {/* 3e Place (Droite) */}
            <Link
              to={top3.isMe ? '/profil' : `/joueurs/${top3.id}`}
              className="flex flex-col items-center group transition transform hover:-translate-y-1"
            >
              <div className="relative -mb-3 z-10 flex flex-col items-center">
                <CustomAvatar name={top3.username} filiere={top3.filiere} size={52} showBadge />
              </div>
              <div
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-t-3xl rounded-b-2xl border-b-4 px-2 py-4 text-center shadow-card transition',
                  podiumColors.c3Bar,
                )}
              >
                <span className="h-display text-3xl font-extrabold text-brand">3</span>
                <span className="mt-1 font-display text-base font-extrabold">{top3.filiere}</span>
                <span className="truncate max-w-[85px] text-[10px] font-bold opacity-75">{top3.username}</span>
                <span className="text-[11px] font-bold opacity-90">{fmtK(top3.xp)}</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ==================== LISTE DES JOUEURS ==================== */}
      <section className="space-y-2.5">
        {entries.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-brand">
              <Sparkles size={24} />
            </div>
            <p className="mt-3 font-display text-base font-bold text-ink">
              Aucun étudiant classé pour l'instant
            </p>
            <p className="mt-1 text-xs font-bold text-muted">
              Gagne de l'XP en complétant un QCM ou en lisant un chapitre pour monter sur le podium !
            </p>
          </div>
        ) : (
          rest.map((row, idx) => {
            const rank = hasPodium ? idx + 4 : idx + 1;
            const highlighted = row.isMe || rank === 1;

            return (
              <Link
                key={row.id}
                to={row.isMe ? '/profil' : `/joueurs/${row.id}`}
                className={cn(
                  'flex items-center gap-3.5 rounded-3xl px-4 py-3.5 transition shadow-card block hover:scale-[1.01]',
                  highlighted && theme === 'violet'
                    ? 'bg-brand text-white shadow-btn-brand'
                    : highlighted
                      ? 'bg-card ring-2 ring-brand/30'
                      : 'bg-card',
                )}
              >
                <span
                  className={cn(
                    'w-6 text-center font-display text-base font-extrabold',
                    highlighted && theme === 'violet' ? 'text-white' : 'text-muted',
                  )}
                >
                  #{rank}
                </span>

                <CustomAvatar name={row.username} filiere={row.filiere} size={40} showBadge />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-extrabold">{row.filiere}</span>
                    <span
                      className={cn(
                        'truncate text-xs font-bold',
                        highlighted && theme === 'violet' ? 'text-white/85' : 'text-muted',
                      )}
                    >
                      · {row.username}
                      {row.isMe ? ' (Toi)' : ''}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    'font-display text-sm font-extrabold tabular-nums',
                    highlighted && theme === 'violet' ? 'text-white' : 'text-ink',
                  )}
                >
                  {fmtK(row.xp)}
                </span>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
