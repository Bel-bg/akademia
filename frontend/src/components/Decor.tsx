import { cn } from '@/lib/utils';
import { Mascot } from './Mascot';

/**
 * Grappes de nuages dans les coins inférieurs (Onboarding, Auth, Filière gagnante).
 */
export function CornerClouds({
  variant = 'brand',
  className,
}: {
  variant?: 'brand' | 'soft' | 'night';
  className?: string;
}) {
  const mainFill =
    variant === 'night'
      ? 'rgb(var(--brand))'
      : variant === 'soft'
        ? 'rgb(var(--brand-light) / 0.35)'
        : 'rgb(var(--brand))';
  const backFill =
    variant === 'night'
      ? 'rgb(var(--brand-light) / 0.35)'
      : 'rgb(var(--brand-light) / 0.45)';

  return (
    <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden h-36 select-none', className)} aria-hidden="true">
      {/* Nuage coin bas-gauche */}
      <svg viewBox="0 0 220 120" className="absolute -bottom-3 -left-4 h-28 w-48 sm:h-32 sm:w-56">
        <path
          d="M -20 120 L -20 45 C 5 25, 42 32, 54 58 C 76 42, 112 52, 118 82 C 145 78, 168 96, 170 120 Z"
          fill={backFill}
        />
        <path
          d="M -20 120 L -20 62 C 2 42, 36 48, 48 72 C 68 58, 102 68, 108 94 C 132 90, 152 104, 154 120 Z"
          fill={mainFill}
        />
      </svg>

      {/* Nuage coin bas-droite */}
      <svg viewBox="0 0 220 120" className="absolute -bottom-3 -right-4 h-28 w-48 sm:h-32 sm:w-56">
        <path
          d="M 240 120 L 240 40 C 212 22, 174 30, 162 56 C 138 42, 104 54, 98 82 C 72 78, 50 96, 48 120 Z"
          fill={backFill}
        />
        <path
          d="M 240 120 L 240 58 C 216 40, 180 46, 168 70 C 148 56, 116 68, 110 94 C 86 90, 66 104, 64 120 Z"
          fill={mainFill}
        />
      </svg>
    </div>
  );
}

/**
 * Confettis géométriques (losanges, carrés, étoiles à 4 branches) autour de la mascotte lors des célébrations.
 */
export function ConfettiBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 260"
      className={cn('pointer-events-none absolute inset-0 h-full w-full select-none', className)}
      aria-hidden="true"
    >
      {/* Losanges gauche */}
      <rect x="34" y="42" width="12" height="12" rx="2" transform="rotate(45 34 42)" fill="rgb(var(--brand))" opacity="0.85" />
      <rect x="64" y="88" width="10" height="10" rx="2" transform="rotate(30 64 88)" fill="rgb(var(--gold))" />
      <rect x="24" y="132" width="11" height="11" rx="2" transform="rotate(55 24 132)" fill="rgb(var(--brand-light))" />
      <rect x="52" y="182" width="9" height="9" rx="2" transform="rotate(20 52 182)" fill="rgb(var(--good))" opacity="0.85" />
      <circle cx="82" cy="36" r="4.5" fill="rgb(var(--brand-light))" />

      {/* Losanges droite */}
      <rect x="312" y="38" width="12" height="12" rx="2" transform="rotate(45 312 38)" fill="rgb(var(--gold))" />
      <rect x="288" y="82" width="10" height="10" rx="2" transform="rotate(25 288 82)" fill="rgb(var(--brand))" opacity="0.85" />
      <rect x="326" y="128" width="11" height="11" rx="2" transform="rotate(40 326 128)" fill="rgb(var(--good))" opacity="0.85" />
      <rect x="296" y="176" width="9" height="9" rx="2" transform="rotate(60 296 176)" fill="rgb(var(--brand-light))" />
      <circle cx="272" cy="34" r="4.5" fill="rgb(var(--gold))" />
    </svg>
  );
}

/**
 * Étoile à 4 branches (Sparkle) présente sur le Splash screen et les trophées.
 */
export function FourPointStar({ size = 28, className, color = 'currentColor' }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn('select-none', className)} aria-hidden="true">
      <path
        d="M16 1 C17.5 10.5, 21.5 14.5, 31 16 C21.5 17.5, 17.5 21.5, 16 31 C14.5 21.5, 10.5 17.5, 1 16 C10.5 14.5, 14.5 10.5, 16 1 Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Médaille hexagonale étoilée (écran "+75 XP · Bravo champion !").
 */
export function HexStarMedal({ size = 68, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full drop-shadow-sm">
        <polygon
          points="40,4 72,22 72,58 40,76 8,58 8,22"
          fill="rgb(var(--gold))"
          stroke="rgb(var(--ink))"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <polygon
          points="40,12 64,26 64,54 40,68 16,54 16,26"
          fill="rgb(255 255 255 / 0.25)"
        />
        <path
          d="M40 21 L44.9 31.2 L56.1 32.8 L48 40.7 L49.9 51.9 L40 46.6 L30.1 51.9 L32 40.7 L23.9 32.8 L35.1 31.2 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

/**
 * Coche verte circulaire (écran "Bonne réponse !").
 */
export function SuccessCheckCircle({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 72 72" className="h-full w-full drop-shadow-sm">
        <circle cx="36" cy="36" r="32" fill="rgb(var(--good))" />
        <circle cx="36" cy="36" r="26" fill="rgb(255 255 255 / 0.14)" />
        <path
          d="M 23 36.5 L 32 45.5 L 50 27.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Coupe de victoire entourée de lauriers avec mascotte intégrée (écran "Filière gagnante !").
 */
export function WinnerTrophyCup({
  mascotColor,
  size = 180,
  className,
}: {
  mascotColor?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)} style={{ width: size, height: size * 0.88 }} aria-hidden="true">
      <svg viewBox="0 0 240 200" className="h-full w-full overflow-visible">
        {/* Couronne de lauriers gauche */}
        <g fill="rgb(var(--gold))" opacity="0.92">
          <ellipse cx="42" cy="142" rx="12" ry="6" transform="rotate(-35 42 142)" />
          <ellipse cx="30" cy="118" rx="12" ry="6" transform="rotate(-20 30 118)" />
          <ellipse cx="26" cy="92" rx="12" ry="6" transform="rotate(-5 26 92)" />
          <ellipse cx="32" cy="66" rx="12" ry="6" transform="rotate(15 32 66)" />
          <ellipse cx="46" cy="44" rx="12" ry="6" transform="rotate(35 46 44)" />
        </g>
        {/* Couronne de lauriers droite */}
        <g fill="rgb(var(--gold))" opacity="0.92">
          <ellipse cx="198" cy="142" rx="12" ry="6" transform="rotate(35 198 142)" />
          <ellipse cx="210" cy="118" rx="12" ry="6" transform="rotate(20 210 118)" />
          <ellipse cx="214" cy="92" rx="12" ry="6" transform="rotate(5 214 92)" />
          <ellipse cx="208" cy="66" rx="12" ry="6" transform="rotate(-15 208 66)" />
          <ellipse cx="194" cy="44" rx="12" ry="6" transform="rotate(-35 194 44)" />
        </g>

        {/* Anses de la coupe */}
        <path
          d="M 68 48 C 38 48, 38 102, 74 106"
          fill="none"
          stroke="rgb(var(--gold))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 172 48 C 202 48, 202 102, 166 106"
          fill="none"
          stroke="rgb(var(--gold))"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Corps de la coupe */}
        <path
          d="M 64 30 L 176 30 L 166 102 C 160 134, 80 134, 74 102 Z"
          fill="rgb(var(--gold))"
          stroke="#B45309"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Pied de la coupe */}
        <rect x="108" y="128" width="24" height="28" rx="4" fill="rgb(var(--gold))" stroke="#B45309" strokeWidth="3" />
        <rect x="82" y="152" width="76" height="18" rx="9" fill="rgb(var(--gold))" stroke="#B45309" strokeWidth="3.5" />
      </svg>

      {/* Mascotte nichée au cœur de la coupe */}
      <div className="absolute top-[14%] flex items-center justify-center">
        <Mascot mood="proud" size={Math.round(size * 0.48)} color={mascotColor} animate={false} />
      </div>
    </div>
  );
}

/**
 * Icône Flamme bicolore (Séries / Streak).
 */
export function FlameBadgeIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn(' inline-block shrink-0 select-none', className)} aria-hidden="true">
      <path
        d="M17.5 3 C17.5 3, 25 9.5, 25 17.5 C25 23.5, 20.5 28, 15.5 28 C10.5 28, 6.5 23.8, 6.5 18.2 C6.5 14.2, 9 10.5, 11.2 8.8 C11.2 8.8, 10.8 12.2, 13 13 C12.2 8.5, 15 5, 17.5 3 Z"
        fill="#FF6B2B"
      />
      <path
        d="M16 13.5 C16 13.5, 20.5 16.8, 20.5 21 C20.5 24.5, 18.2 27, 15.5 27 C12.8 27, 10.8 24.6, 10.8 21.5 C10.8 18.8, 13.2 16, 16 13.5 Z"
        fill="#FFD026"
      />
    </svg>
  );
}

/**
 * Icône Coupe dorée (Classement / Podium).
 */
export function TrophyBadgeIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn('inline-block shrink-0 select-none', className)} aria-hidden="true">
      <path d="M8 7 H24 V14 C24 18.5 20.5 22 16 22 C11.5 22 8 18.5 8 14 Z" fill="#FFC93C" />
      <path d="M8 9 H5 C4 9 3.5 10 3.5 11.5 C3.5 14 5.5 16 8 16" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 9 H27 C28 9 28.5 10 28.5 11.5 C28.5 14 26.5 16 24 16" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="13.5" y="21" width="5" height="4.5" fill="#F59E0B" />
      <rect x="10" y="25" width="12" height="3.5" rx="1.75" fill="#FFC93C" />
    </svg>
  );
}

/**
 * Icône Épées croisées (Battles de filières ARI vs AIP) en SVG vectoriel.
 */
export function CrossedSwordsIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={cn('inline-block shrink-0 select-none', className)} aria-hidden="true">
      {/* Lame 1 */}
      <path d="M5 5 L19 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 21 L21 15" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M18.5 18.5 L22.5 22.5" stroke="#B45309" strokeWidth="3.2" strokeLinecap="round" />
      {/* Lame 2 */}
      <path d="M23 5 L9 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M7 15 L13 21" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M9.5 18.5 L5.5 22.5" stroke="#B45309" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Icône Célébration / Confetti Popper en SVG vectoriel.
 */
export function PartyPopperIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={cn('inline-block shrink-0 select-none', className)} aria-hidden="true">
      <path d="M5 23 L10 9 L19 18 Z" fill="#FFD026" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="19" cy="8" r="2" fill="#FF574A" />
      <circle cx="23" cy="13" r="1.8" fill="#22C55E" />
      <circle cx="14" cy="5" r="1.8" fill="#7C3AED" />
      <path d="M16 11 C18 8, 21 7, 24 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * Icône Éclair d'énergie / Force en SVG vectoriel.
 */
export function BoltBadgeIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn('inline-block shrink-0 select-none', className)} aria-hidden="true">
      <path
        d="M13.5 2 L5 13.5 H11.5 L10.5 22 L19 10.5 H12.5 Z"
        fill="#FFD026"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Étoiles de difficulté (1 à 3) en SVG pur.
 */
export function DifficultyStars({ level, max = 3, size = 13 }: { level: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Difficulté ${level} sur ${max}`}>
      {Array.from({ length: max }).map((_, idx) => {
        const filled = idx < level;
        return (
          <svg key={idx} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 1.8 L12.4 6.7 L17.8 7.5 L13.9 11.3 L14.8 16.7 L10 14.1 L5.2 16.7 L6.1 11.3 L2.2 7.5 L7.6 6.7 Z"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity={filled ? 1 : 0.35}
            />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * Logo officiel Google "G" multicolore pour le bouton "Continuer avec Google".
 */
export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
