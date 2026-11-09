import { useEffect, useRef, useState } from 'react';
import { Cross, Sparkles } from '@getpapillon/papicons';
import { WinnerTrophyCup } from '@/components/Decor';
import { Mascot } from '@/components/Mascot';
import { fireConfetti } from '@/components/Celebrations';
import { WeeklyBattleInfo } from '@/data/repo';

interface WeeklyBattleWinnerModalProps {
  battle: WeeklyBattleInfo | null;
  onClose?: () => void;
}

export function WeeklyBattleWinnerModal({ battle, onClose }: WeeklyBattleWinnerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const battleId = battle?.id;

  useEffect(() => {
    if (!battle || !battleId) return;

    const storageKey = `akademia:winner_modal_seen:${battleId}`;

    const isAlreadySeen = () => {
      try {
        return (
          localStorage.getItem(storageKey) === 'true' ||
          sessionStorage.getItem(storageKey) === 'true'
        );
      } catch {
        return false;
      }
    };

    if (hasDismissed || isAlreadySeen()) {
      setIsOpen(false);
      return;
    }

    const checkShouldOpen = () => {
      if (hasDismissed || isAlreadySeen()) {
        setIsOpen(false);
        return false;
      }

      const now = Date.now();
      const endsTime = new Date(battle.endsAt).getTime();
      const isPastEnd = (now >= endsTime || battle.isFinished) && Boolean(battle.winner);

      if (isPastEnd) {
        setIsOpen(true);
        return true;
      }
      return false;
    };

    const opened = checkShouldOpen();
    if (opened) return;

    const interval = setInterval(() => {
      const openedNow = checkShouldOpen();
      if (openedNow) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [battle, battleId, hasDismissed]);

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

  const handleDismiss = () => {
    if (battleId) {
      try {
        localStorage.setItem(`akademia:winner_modal_seen:${battleId}`, 'true');
        sessionStorage.setItem(`akademia:winner_modal_seen:${battleId}`, 'true');
      } catch {
        /* ignore */
      }
    }
    setHasDismissed(true);
    setIsOpen(false);
    onClose?.();
  };

  if (!battle || hasDismissed || !isOpen) return null;

  const totalXp = Math.max(1, battle.ariScore + battle.aipScore);
  const aipPct = Math.round((battle.aipScore / totalXp) * 100);
  const ariPct = 100 - aipPct;

  const winner = battle.winner || (battle.aipScore >= battle.ariScore ? 'AIP' : 'ARI');
  const isAipWinner = winner === 'AIP';
  // Palette : AIP = Violet (#7C3AED), ARI = Bleu Azur (#1D6FFF)
  const winnerColor = isAipWinner ? '#7C3AED' : '#1D6FFF';
  const winnerPct = isAipWinner ? aipPct : ariPct;

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        // Clic sur l'overlay / arrière-plan ferme immédiatement la modale sur mobile
        if (e.target === dialogRef.current) {
          handleDismiss();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        handleDismiss();
      }}
      className="m-auto max-h-[90vh] w-[92vw] max-w-sm overflow-y-auto rounded-3xl border border-line bg-card p-0 text-ink shadow-elevated backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative overflow-hidden p-6 text-center">
        {/* Bouton de fermeture d'angle pour mobile */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3.5 top-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-bg/80 text-muted transition hover:bg-soft hover:text-ink focus:outline-none"
          aria-label="Fermer l'annonce de victoire"
        >
          <Cross size={18} />
        </button>

        {/* Halo lumineux */}
        <div
          className="pointer-events-none absolute -top-12 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full blur-2xl"
          style={{
            background: isAipWinner
              ? 'rgba(124, 58, 237, 0.25)'
              : 'rgba(29, 111, 255, 0.25)',
          }}
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

          {/* Comparatif des scores de la battle */}
          <div className="mt-4 grid w-full grid-cols-2 gap-2.5 rounded-2xl border border-line bg-bg p-3">
            <div className="flex flex-col items-center rounded-xl bg-card p-2">
              <span className="text-xs font-black text-[#7C3AED]">AIP</span>
              <span className="font-display text-lg font-black text-ink">{battle.aipScore} XP</span>
              <span className="text-[10px] font-bold text-muted">
                {battle.aipMembers} étudiant{battle.aipMembers > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-card p-2">
              <span className="text-xs font-black text-[#1D6FFF]">ARI</span>
              <span className="font-display text-lg font-black text-ink">{battle.ariScore} XP</span>
              <span className="text-[10px] font-bold text-muted">
                {battle.ariMembers} étudiant{battle.ariMembers > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-primary mt-5 flex w-full items-center justify-center gap-2 !py-3.5 text-base font-extrabold shadow-button"
          >
            <span>Continuer sur Akademia</span>
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    </dialog>
  );
}
