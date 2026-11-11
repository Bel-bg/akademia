import { useEffect, useState } from 'react';
import { Check, Cross as X, ExternalLink, Sparkles } from '@getpapillon/papicons';
import type { Formation } from '@/lib/types';
import {
  copyFormationLink,
  downloadFormationImage,
  getFormationDirectUrl,
  renderFormationShareCanvas,
  type FormationShareMeta,
} from '@/lib/formationShareImage';
import { GlassesCloud } from './GlassesCloud';
import { AnimatedEmoji } from './AnimatedEmoji';

export interface FormationShareProps {
  formation: Formation;
  moduleTitle: string;
  moduleEmoji?: string;
  moduleColor?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

export function DownloadImageIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function CopyLinkIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function FormationShareModal({
  formation: f,
  moduleTitle,
  moduleEmoji = '📚',
  moduleColor = '#6366f1',
  isOpen,
  onClose,
}: FormationShareProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const meta: FormationShareMeta = {
    title: f.title,
    tagline: f.tagline,
    emoji: f.emoji,
    color: f.color || moduleColor,
    level: f.level,
    minutes: f.minutes,
    benefits: f.benefits,
    lessonsCount: f.lessons.length,
    moduleId: f.moduleId,
    moduleTitle,
    moduleEmoji,
  };

  const directUrl = getFormationDirectUrl(f.moduleId, f.id);

  // Générer un aperçu de l'image dès l'ouverture
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setCopied(false);
      setDownloading(false);
      return;
    }

    let isMounted = true;
    setGeneratingPreview(true);

    renderFormationShareCanvas(meta)
      .then((canvas) => {
        if (!isMounted) return;
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setPreviewUrl(dataUrl);
        } catch (e) {
          console.error('Erreur aperçu:', e);
        }
      })
      .catch((err) => console.error('Erreur render:', err))
      .finally(() => {
        if (isMounted) setGeneratingPreview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, f.id]);

  // Fermeture par touche Echap
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyFormationLink(f.moduleId, f.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadFormationImage(meta);
    } catch (e) {
      console.error('Erreur lors du téléchargement de l’image:', e);
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/65 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-formation-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-4xl border border-line/70 bg-card shadow-pop sm:rounded-4xl animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <header
          className="flex items-center justify-between border-b border-line/60 px-5 py-4"
          style={{ background: `linear-gradient(90deg, ${meta.color}25, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ background: meta.color }}
            >
              <ShareIcon size={20} />
            </span>
            <div>
              <h2 id="share-formation-title" className="h-display text-lg leading-tight text-ink">
                Partager la formation
              </h2>
              <p className="text-xs font-bold text-muted">
                {moduleEmoji} {moduleTitle} · {f.level}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-soft hover:text-ink transition"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Corps modal scrollable */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Carte récapitulative de la formation */}
          <div
            className="rounded-3xl border border-line/70 p-4 transition"
            style={{ background: `linear-gradient(135deg, ${meta.color}18, transparent)` }}
          >
            <div className="flex items-start gap-3.5">
              <span className="text-3xl shrink-0">
                <AnimatedEmoji emoji={f.emoji} size="2.2rem" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="h-display text-xl leading-snug text-ink">{f.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-muted">{f.tagline}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-muted">
                  <span className="rounded-full bg-soft px-2.5 py-0.5 text-brand">{f.level}</span>
                  <span>~{f.minutes} min</span>
                  <span>·</span>
                  <span>{f.lessons.length} leçons interactives</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu visuel généré en temps réel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-muted">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand" />
                <span>Aperçu de la carte HD générée</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted/80">Format 16:9</span>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line/80 bg-ink/90 shadow-inner flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Carte de partage : ${f.title}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-4 text-center text-white/80">
                  <GlassesCloud size={70} color={meta.color} talking={generatingPreview} />
                  <span className="text-xs font-bold">
                    {generatingPreview ? 'Génération de la carte HD…' : 'Chargement…'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Les 2 options de partage principales demandées par l'utilisateur */}
          <div className="space-y-2.5 pt-1">
            {/* Option 1 : Enregistrer sous forme d'image */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-brand/30 bg-soft/60 hover:bg-soft px-4 py-3.5 text-left transition hover:border-brand hover:shadow-card group"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
                  style={{ background: meta.color }}
                >
                  <DownloadImageIcon size={22} />
                </span>
                <div>
                  <span className="font-display block text-base font-extrabold text-ink">
                    {downloading ? 'Génération et téléchargement…' : "Enregistrer sous forme d'image"}
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    Télécharge une carte visuelle HD prête à partager sur WhatsApp, Insta, Twitter…
                  </span>
                </div>
              </div>
              <span className="chip bg-brand text-white font-extrabold shrink-0">
                {downloading ? '…' : 'PNG HD'}
              </span>
            </button>

            {/* Option 2 : Copier le lien direct */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition hover:shadow-card group ${
                copied
                  ? 'border-good bg-good/15 text-good'
                  : 'border-line/80 bg-card hover:border-brand/40 hover:bg-soft/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105 ${
                    copied ? 'bg-good text-white' : 'bg-soft text-brand'
                  }`}
                >
                  {copied ? <Check size={22} /> : <CopyLinkIcon size={22} />}
                </span>
                <div className="min-w-0">
                  <span className="font-display block text-base font-extrabold text-ink">
                    {copied ? 'Lien copié dans le presse-papiers ! 🎉' : 'Copier le lien direct'}
                  </span>
                  <span className="truncate block text-xs font-semibold text-muted">
                    {directUrl}
                  </span>
                </div>
              </div>
              <span
                className={`chip font-extrabold shrink-0 ${
                  copied ? 'bg-good text-white' : 'bg-soft text-brand'
                }`}
              >
                {copied ? 'Copié !' : 'Copier'}
              </span>
            </button>
          </div>
        </div>

        {/* Pied de modal avec lien rapide et bouton fermer */}
        <footer className="flex items-center justify-between border-t border-line/60 bg-bg/60 px-5 py-3 text-xs">
          <span className="font-semibold text-muted">Partage avec tes camarades de promo ! 🎓</span>
          <button type="button" onClick={onClose} className="btn btn-ghost !py-1.5 !px-3 text-xs">
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Bouton d'action Partage à insérer au bas des cartes de formation.
 */
export function FormationShareAction({
  formation,
  moduleTitle,
  moduleEmoji,
  moduleColor,
  className = '',
}: {
  formation: Formation;
  moduleTitle: string;
  moduleEmoji?: string;
  moduleColor?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`btn btn-soft !px-3 !py-2 text-xs font-extrabold gap-1.5 transition hover:scale-105 ${className}`}
        title="Partager cette formation"
        aria-label={`Partager la formation ${formation.title}`}
      >
        <ShareIcon size={15} />
        <span>Partager</span>
      </button>

      <FormationShareModal
        formation={formation}
        moduleTitle={moduleTitle}
        moduleEmoji={moduleEmoji}
        moduleColor={moduleColor}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
