import { useState } from 'react';
import { Check } from '@getpapillon/papicons';
import type { Formation } from '@/lib/types';
import { copyFormationLink } from '@/lib/formationShareImage';
import { cn } from '@/lib/utils';

export function ShareIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

/**
 * Bouton Partage : le clic copie directement le lien de la formation dans le presse-papiers
 * avec confirmation visuelle immédiate.
 */
export function FormationShareAction({
  formation,
  className = '',
}: {
  formation: Formation;
  moduleTitle?: string;
  moduleEmoji?: string;
  moduleColor?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyFormationLink(formation.moduleId, formation.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        'btn !px-3 !py-2 text-xs font-extrabold gap-1.5 transition-all shadow-sm',
        copied
          ? 'bg-good text-white hover:bg-good shadow-sm'
          : 'btn-soft text-muted hover:text-ink',
        className,
      )}
      title="Copier le lien direct de la formation"
      aria-label={`Copier le lien de la formation ${formation.title}`}
    >
      {copied ? (
        <>
          <Check size={14} className="animate-scaleIn" />
          <span>Lien copié !</span>
        </>
      ) : (
        <>
          <ShareIcon size={14} />
          <span>Partager</span>
        </>
      )}
    </button>
  );
}

export default FormationShareAction;
