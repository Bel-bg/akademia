import { useEffect, useRef, useState } from 'react';
import { Sparkles } from '@getpapillon/papicons';
import { WinnerTrophyCup, CrossedSwordsIcon } from '@/components/Decor';
import { Mascot } from '@/components/Mascot';
import { fireConfetti } from '@/components/Celebrations';
import { WeeklyBattleInfo } from '@/data/repo';
import { cn } from '@/lib/utils';

interface WeeklyBattleWinnerModalProps {
  battle: WeeklyBattleInfo | null;
  onClose?: () => void;
}

export function WeeklyBattleWinnerModal({ battle, onClose }: WeeklyBattleWinnerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!battle) return;

    const storageKey = `akademia:winner_modal_seen:${battle.id}`;
    const alreadySeen = localStorage.getItem(storageKey);

    const checkShouldOpen = () => {
      const now = Date.now();
      const endsTime = new Date(battle.endsAt).getTime();
      const isPastEnd = now >= endsTime || battle.isFinished;

      if (isPastEnd && !alreadySeen) {
        setIsOpen(true);
      }
    };

    checkShouldOpen();
    const interval = setInterval(checkShouldOpen, 5000);
    return () => clearInterval(interval);
  }, [battle]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    if (isOpen) {
      if (!dlg.open) dlg.showModal();
      fireConfetti(true);
    } else if (dlg.open) {
      dlg.close();
    }
  }, [isOpen]);

  if (!battle) return null;

  const handleDismiss = () => {
    localStorage.setItem(`akademia:winner_modal_seen:${battle.id}`, 'true');
    setIsOpen(false);
    onClose?.();
  };

  const totalXp = Math.max(1, battle.ariScore + battle.aipScore);
  const aipPct = Math.round((battle.aipScore / totalXp) * 100);
  const ariPct = 100 - aipPct;

  const winner = battle.winner || (battle.aipScore >= battle.ariScore ? 'AIP' : 'ARI');
  const isAipWinner = winner === 'AIP';
  const winnerColor = isAipWinner ? '#7C3AED' : '#FF574A';
  const winnerPct = isAipWinner ? aipPct : ariPct;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleDismiss();
      }}
      className="m-auto w-[92vw] max-w-sm rounded-3xl border border-line bg-card p-0 text-ink shadow-elevated backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative overflow-hidden p-6 text-center">
        {/* Halo doré / festif */}
        <div
          className="pointer-events-none absolute -top-12 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: isAipWinner ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 87, 74, 0.25)' }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center">
          <div className="mb-2">
            <WinnerTrophyCup size={76} />
          </div>

          <span className="inline-block rounded-full bg-soft px-3 py-1 text-xs font-black uppercase tracking-wider text-brand">
            Fin de la Battle · Samedi 18h
          </span>

          <h2 className="h-display mt-2 text-2xl font-black text-ink">
            Filière gagnante !
          </h2>

          {/* Mascotte de la filière gagnante */}
          <div className="relative my-3 flex items-center justify-center">
            <Mascot mood="proud" crown={true} size={96} color={winnerColor} animate={true} />
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-display text-xl font-black text-white shadow-card"
            style={{ backgroundColor: winnerColor }}
          >
            <span>Filière {winner}</span>
            <WinnerTrophyCup size={20} />
          </div>

          <p className="mt-3 text-sm font-bold text-muted">
            {winner === 'EGALITE' ? (
              <span>Égalité parfaite entre l'ARI et l'AIP avec {battle.ariScore} XP chacune !</span>
            ) : (
              <span>
                La filière <b>{winner}</b> remporte la battle de la semaine avec{' '}
                <b>{winnerPct}%</b> des points ({winner === 'AIP' ? battle.aipScore : battle.ariScore} XP) !
              </span>
            )}
          </p>

          {/* Comparatif des scores */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2.5 rounded-2xl bg-bg p-3 border border-line">
            <div className="flex flex-col items-center rounded-xl p-2 bg-card">
              <span className="text-xs font-black text-[#8B5CF6]">AIP</span>
              <span className="font-display text-lg font-black text-ink">{battle.aipScore} XP</span>
              <span className="text-[10px] font-bold text-muted">{battle.aipMembers} étudiant{battle.aipMembers > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl p-2 bg-card">
              <span className="text-xs font-black text-[#FF574A]">ARI</span>
              <span className="font-display text-lg font-black text-ink">{battle.ariScore} XP</span>
              <span className="text-[10px] font-bold text-muted">{battle.ariMembers} étudiant{battle.ariMembers > 1 ? 's' : ''}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-primary mt-5 flex w-full items-center justify-center gap-2 !py-3.5 text-base font-extrabold shadow-button"
          >
            <span>Bravo à tous !</span>
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
}
