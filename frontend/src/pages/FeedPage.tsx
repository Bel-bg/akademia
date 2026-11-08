import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  Crown,
  Folder,
  Sparkles,
  Star,
} from '@getpapillon/papicons';
import { BattleHistoryItem, fetchBattle, WeeklyBattleInfo } from '@/data/repo';
import { Mascot } from '@/components/Mascot';
import {
  CrossedSwordsIcon,
  FourPointStar,
  PartyPopperIcon,
  WinnerTrophyCup,
} from '@/components/Decor';
import { Spinner } from '@/components/ui';
import { useTheme } from '@/state/Theme';
import { cn } from '@/lib/utils';

export default function FeedPage() {
  const { filiere } = useTheme();
  const [loading, setLoading] = useState(true);
  const [currentBattle, setCurrentBattle] = useState<WeeklyBattleInfo | null>(null);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetchBattle()
      .then((data) => {
        if (!alive) return;
        setCurrentBattle(data.currentBattle);
        setHistory(data.history || []);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !currentBattle) {
    return <Spinner label="Chargement des battles universitaires…" />;
  }

  const totalScore = Math.max(1, currentBattle.ariScore + currentBattle.aipScore);
  const aipPct = Math.round((currentBattle.aipScore / totalScore) * 100);
  const ariPct = 100 - aipPct;

  const currentLeader =
    currentBattle.aipScore > currentBattle.ariScore
      ? 'AIP'
      : currentBattle.ariScore > currentBattle.aipScore
      ? 'ARI'
      : 'EGALITE';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* En-tête Actu */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3.5 py-1 text-xs font-black uppercase tracking-wider text-brand">
          <CrossedSwordsIcon size={16} /> Campus Akademia
        </span>
        <h1 className="h-display mt-2 text-2xl sm:text-3xl">Actualités & Battles</h1>
        <p className="mt-1 text-xs font-bold text-muted">
          Compétition hebdomadaire : du lundi 00h00 au samedi 18h00 pile.
        </p>
      </div>

      {/* ==================== CARTE BATTLE DE LA SEMAINE EN COURS ==================== */}
      <section className="card relative overflow-hidden p-5 sm:p-6 shadow-pop">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-soft text-brand">
              <Calendar size={18} />
            </span>
            <div>
              <div className="font-display text-sm font-black text-ink">{currentBattle.weekLabel}</div>
              <div className="text-[11px] font-bold text-muted">Battle de la semaine</div>
            </div>
          </div>

          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black',
              currentBattle.isFinished
                ? 'bg-[#22C55E]/15 text-[#16A34A]'
                : 'bg-brand/15 text-brand animate-pulse',
            )}
          >
            {currentBattle.isFinished ? 'Terminée · Samedi 18h' : 'En direct · Fin samedi 18h'}
          </span>
        </div>

        {/* Duel visuel mascottes : AIP vs ARI */}
        <div className="my-5 grid grid-cols-2 items-center gap-3">
          {/* Camp AIP */}
          <div
            className={cn(
              'relative flex flex-col items-center rounded-3xl border-2 p-4 text-center transition',
              currentLeader === 'AIP'
                ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-sm'
                : 'border-line bg-card',
            )}
          >
            <Mascot mood={currentLeader === 'AIP' ? 'happy' : 'idle'} size={72} color="#7C3AED" animate={false} />
            <div className="mt-2 font-display text-xl font-black text-[#7C3AED]">AIP</div>
            <div className="text-xs font-bold text-muted">Auto & Info Ind.</div>
            <div className="mt-2 font-display text-lg font-black text-ink">
              {currentBattle.aipScore} XP
            </div>
            <div className="text-[10px] font-bold text-muted">
              {currentBattle.aipMembers} étudiant{currentBattle.aipMembers > 1 ? 's' : ''}
            </div>
          </div>

          {/* Camp ARI */}
          <div
            className={cn(
              'relative flex flex-col items-center rounded-3xl border-2 p-4 text-center transition',
              currentLeader === 'ARI'
                ? 'border-[#FF574A] bg-[#FF574A]/10 shadow-sm'
                : 'border-line bg-card',
            )}
          >
            <Mascot mood={currentLeader === 'ARI' ? 'happy' : 'idle'} size={72} color="#FF574A" animate={false} />
            <div className="mt-2 font-display text-xl font-black text-[#FF574A]">ARI</div>
            <div className="text-xs font-bold text-muted">Réseaux & IoT</div>
            <div className="mt-2 font-display text-lg font-black text-ink">
              {currentBattle.ariScore} XP
            </div>
            <div className="text-[10px] font-bold text-muted">
              {currentBattle.ariMembers} étudiant{currentBattle.ariMembers > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Barre de répartition des scores de filières */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-black">
            <span className="text-[#7C3AED]">AIP : {aipPct}%</span>
            <span className="text-[#FF574A]">ARI : {ariPct}%</span>
          </div>
          <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-soft">
            <div
              className="bg-[#7C3AED] transition-all duration-700"
              style={{ width: `${aipPct}%` }}
              title={`AIP: ${aipPct}%`}
            />
            <div
              className="bg-[#FF574A] transition-all duration-700"
              style={{ width: `${ariPct}%` }}
              title={`ARI: ${ariPct}%`}
            />
          </div>
        </div>

        {/* Vainqueur proclamé si terminée */}
        {currentBattle.isFinished && currentBattle.winner && (
          <div className="mt-5 rounded-2xl border-2 border-brand bg-soft/75 p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <WinnerTrophyCup size={32} />
              <span className="font-display text-lg font-black text-ink">
                Filière gagnante de la semaine :{' '}
                <span className="text-brand">{currentBattle.winner}</span> !
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-muted">
              Prochaine battle réinitialisée lundi à 00h00 pile.
            </p>
          </div>
        )}

        {/* Bouton d'action pour contribuer */}
        {!currentBattle.isFinished && (
          <div className="mt-5 pt-2">
            <Link
              to="/modules"
              className="btn btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-extrabold shadow-button"
            >
              <Folder size={18} />
              <span>Réviser pour faire gagner des points à la filière {filiere}</span>
            </Link>
          </div>
        )}
      </section>

      {/* ==================== HISTORIQUE DES BATTLES PASSÉES ==================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="h-display flex items-center gap-2 text-lg text-ink">
            <WinnerTrophyCup size={22} /> Historique des Battles
          </h2>
          <span className="text-xs font-bold text-muted">
            {history.length} archivée{history.length > 1 ? 's' : ''}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-brand">
              <Sparkles size={28} />
            </div>
            <h3 className="h-display mt-3 text-lg font-black text-ink">Première battle en cours</h3>
            <p className="mt-1 max-w-sm text-xs font-bold leading-relaxed text-muted">
              L'historique des battles s'écrira ici chaque samedi à 18h00 pile dès la clôture des scores entre l'ARI et l'AIP !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const isAip = item.winner === 'AIP';
              const winnerColor = isAip ? '#7C3AED' : '#FF574A';
              const total = Math.max(1, item.ariScore + item.aipScore);
              const pct = Math.round(
                ((isAip ? item.aipScore : item.ariScore) / total) * 100,
              );

              return (
                <div
                  key={item.id}
                  className="card flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between hover:shadow-card"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                      style={{ background: winnerColor }}
                    >
                      <WinnerTrophyCup size={26} />
                    </div>

                    <div>
                      <div className="font-display text-base font-black text-ink">
                        Gagnant : Filière {item.winner}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted">
                        <span>{item.weekLabel}</span>
                        <span>·</span>
                        <span>{pct}% des points</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-line pt-2 sm:border-0 sm:pt-0">
                    <div className="flex items-center gap-3 text-xs font-black">
                      <span className="rounded-lg bg-[#7C3AED]/10 px-2 py-1 text-[#7C3AED]">
                        AIP : {item.aipScore} XP
                      </span>
                      <span className="rounded-lg bg-[#FF574A]/10 px-2 py-1 text-[#FF574A]">
                        ARI : {item.ariScore} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
