import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, PageTitle, Spinner } from '@/components/ui';
import { fetchLeaderboard, LeaderRow } from '@/data/repo';
import { tierFor } from '@/lib/gamification';
import { cn, fmtNum } from '@/lib/utils';
import { useAuth } from '@/state/AuthContext';

export default function LeaderboardPage() {
  const { user, cloud } = useAuth();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!cloud || user?.guest) return;
    fetchLeaderboard().then(setRows).catch(() => setErr('Impossible de charger le classement.'));
  }, [cloud, user]);

  if (!cloud) return (<><PageTitle title="Classement" emoji="🏆" /><Empty emoji="🔌" title="Classement indisponible en mode local">Connecte l'application à Supabase (voir docs/DEPLOIEMENT.md) pour comparer ta puissance avec les autres apprenants.</Empty></>);
  if (user?.guest) return (<><PageTitle title="Classement" emoji="🏆" /><Empty emoji="🔐" title="Connecte-toi pour apparaître au classement"><Link to="/connexion" className="btn btn-primary mt-2">Se connecter</Link></Empty></>);
  if (err) return <Empty emoji="⚠️" title={err} />;
  if (!rows) return <Spinner />;

  return (
    <>
      <PageTitle title="Classement" sub="Les apprenants les plus puissants." emoji="🏆" />
      <div className="card divide-y divide-line">
        {rows.map((r, i) => {
          const t = tierFor(r.level);
          return (
            <Link key={r.id} to={`/joueurs/${r.id}`} className={cn('flex items-center gap-4 p-4 transition hover:bg-soft/70', r.id === user?.id && 'bg-brand/10')} aria-label={`Voir le profil de ${r.username}`}>
              <span className="w-8 text-center text-lg font-extrabold">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: t.color + '33' }}>{t.emoji}</span>
              <div className="min-w-0 flex-1"><div className="truncate font-bold">{r.username}{r.id === user?.id && ' (toi)'}</div><div className="text-xs text-muted">Niv. {r.level} · {t.name} · 🔥 {r.streak} j</div></div>
              <b className="text-accent">{fmtNum(r.xp)} XP</b>
            </Link>
          );
        })}
        {rows.length === 0 && <p className="p-8 text-center text-muted">Personne pour l'instant. Sois le premier !</p>}
      </div>
    </>
  );
}
