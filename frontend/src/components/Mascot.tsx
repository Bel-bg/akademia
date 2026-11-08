import { cn } from '@/lib/utils';

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'wink'
  | 'surprised'
  | 'sad'
  | 'thinking'
  | 'determined'
  | 'proud'
  | 'love'
  | 'sleepy';

export interface MascotProps {
  mood?: MascotMood;
  size?: number;
  /** Override cloud body fill color (e.g. for filière colors on podium/VS cards). Defaults to rgb(var(--brand-light)). */
  color?: string;
  /** Accessories */
  crown?: boolean;
  graduationCap?: boolean;
  eyelashes?: boolean;
  emphasis?: 'top-left' | 'top-right' | 'none';
  animate?: boolean;
  className?: string;
}

/**
 * Mascotte officielle d'Akademia : Nimbo, le nuage universitaire aux grands yeux globuleux.
 * Entièrement vectoriel (SVG), s'adapte automatiquement aux 4 thèmes (Ciel, Corail, Cyan, Violet)
 * ou accepte une couleur personnalisée pour les filières (AIP, ARI, etc.).
 */
export function Mascot({
  mood = 'idle',
  size = 140,
  color,
  crown = false,
  graduationCap = false,
  eyelashes = false,
  emphasis = 'none',
  animate = true,
  className,
}: MascotProps) {
  const fill = color ?? 'rgb(var(--brand-light))';
  const stroke = 'rgb(var(--ink))';

  // Eye gaze offset depending on mood
  const pupilOffset =
    mood === 'thinking'
      ? { x: 2, y: -4 }
      : mood === 'excited'
        ? { x: 1, y: -1 }
        : mood === 'sad'
          ? { x: 0, y: 3 }
          : { x: 0, y: 0 };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', animate && 'animate-float', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 185" className="h-full w-full overflow-visible">
        {/* Traits d'emphase (comme sur les maquettes Onboarding / Splash) */}
        {emphasis === 'top-left' && (
          <g stroke={stroke} strokeWidth="5.5" strokeLinecap="round">
            <line x1="28" y1="36" x2="16" y2="20" />
            <line x1="42" y1="26" x2="36" y2="10" />
          </g>
        )}
        {emphasis === 'top-right' && (
          <g stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round">
            <line x1="162" y1="34" x2="174" y2="14" />
            <line x1="176" y1="44" x2="192" y2="28" />
          </g>
        )}

        {/* Corps du nuage joufflu à 6 lobes (style sticker contour épais) */}
        <g className={cn(mood === 'excited' && 'origin-center -rotate-3')}>
          <path
            d="
              M 62 148
              C 32 148, 16 126, 26 100
              C 12 82, 24 52, 50 52
              C 56 24, 92 14, 114 34
              C 138 16, 174 32, 170 64
              C 192 78, 188 114, 164 126
              C 168 148, 140 160, 118 148
              C 102 158, 76 158, 62 148
              Z
            "
            fill={fill}
            stroke={stroke}
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Reflet / volume doux interne sur le bas du nuage */}
          <path
            d="M 40 128 C 58 146, 138 148, 158 122"
            fill="none"
            stroke="rgb(0 0 0 / 0.08)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 56 42 C 72 28, 96 28, 108 38"
            fill="none"
            stroke="rgb(255 255 255 / 0.38)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Joues roses subtiles */}
          {(mood === 'happy' || mood === 'excited' || mood === 'love' || mood === 'proud') && (
            <>
              <ellipse cx="56" cy="108" rx="9" ry="5.5" fill="#FF6B8B" opacity="0.45" />
              <ellipse cx="144" cy="108" rx="9" ry="5.5" fill="#FF6B8B" opacity="0.45" />
            </>
          )}

          {/* Cils coquets (visibles sur la carte +75 XP des maquettes) */}
          {(eyelashes || mood === 'excited' || mood === 'wink') && mood !== 'happy' && (
            <g stroke={stroke} strokeWidth="3.5" strokeLinecap="round">
              <line x1="65" y1="73" x2="57" y2="66" />
              <line x1="62" y1="81" x2="53" y2="77" />
              <line x1="135" y1="73" x2="143" y2="66" />
              <line x1="138" y1="81" x2="147" y2="77" />
            </g>
          )}

          {/* --- YEUX GLOBULEUX --- */}
          {mood === 'happy' ? (
            /* Yeux en arc joyeux ^^ (fidèle à l'écran "Bonne réponse !" des maquettes) */
            <g fill="none" stroke={stroke} strokeWidth="6.5" strokeLinecap="round">
              <path d="M 68 94 C 73 77, 91 77, 96 94" />
              <path d="M 104 94 C 109 77, 127 77, 132 94" />
            </g>
          ) : mood === 'sleepy' ? (
            /* Yeux mi-clos */
            <g>
              <path d="M 66 90 C 73 98, 91 98, 97 90" fill="none" stroke={stroke} strokeWidth="5.5" strokeLinecap="round" />
              <path d="M 103 90 C 109 98, 127 98, 134 90" fill="none" stroke={stroke} strokeWidth="5.5" strokeLinecap="round" />
            </g>
          ) : (
            /* Grands yeux globuleux signature */
            <g>
              {/* Sclère gauche */}
              <ellipse
                cx="82"
                cy="90"
                rx="18.5"
                ry="22"
                fill="#FFFFFF"
                stroke={stroke}
                strokeWidth="4.5"
              />
              {/* Sclère droite (ou clin d'œil) */}
              {mood === 'wink' ? (
                <path
                  d="M 104 91 C 110 79, 126 79, 132 91"
                  fill="none"
                  stroke={stroke}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
              ) : (
                <ellipse
                  cx="118"
                  cy="90"
                  rx="18.5"
                  ry="22"
                  fill="#FFFFFF"
                  stroke={stroke}
                  strokeWidth="4.5"
                />
              )}

              {/* Pupille gauche + double reflet blanc */}
              <ellipse
                cx={84 + pupilOffset.x}
                cy={91 + pupilOffset.y}
                rx="12"
                ry="14.5"
                fill="#0D1322"
              />
              <circle cx={79 + pupilOffset.x} cy={84 + pupilOffset.y} r="4.5" fill="#FFFFFF" />
              <circle cx={88 + pupilOffset.x} cy={97 + pupilOffset.y} r="2.2" fill="#FFFFFF" />

              {/* Pupille droite + double reflet blanc */}
              {mood !== 'wink' && (
                <>
                  <ellipse
                    cx={116 + pupilOffset.x}
                    cy={91 + pupilOffset.y}
                    rx="12"
                    ry="14.5"
                    fill="#0D1322"
                  />
                  <circle cx={111 + pupilOffset.x} cy={84 + pupilOffset.y} r="4.5" fill="#FFFFFF" />
                  <circle cx={120 + pupilOffset.x} cy={97 + pupilOffset.y} r="2.2" fill="#FFFFFF" />
                </>
              )}

              {/* Sourcils expressifs selon le mood */}
              {mood === 'determined' && (
                <g stroke={stroke} strokeWidth="4.5" strokeLinecap="round">
                  <line x1="68" y1="64" x2="92" y2="71" />
                  <line x1="132" y1="64" x2="108" y2="71" />
                </g>
              )}
              {mood === 'sad' && (
                <g stroke={stroke} strokeWidth="4" strokeLinecap="round">
                  <line x1="66" y1="70" x2="88" y2="63" />
                  <line x1="134" y1="70" x2="112" y2="63" />
                </g>
              )}
            </g>
          )}

          {/* --- BOUCHE --- */}
          {mood === 'excited' || mood === 'proud' ? (
            /* Sourire ouvert joyeux */
            <path
              d="M 91 114 Q 100 126 109 114 Z"
              fill="#1E193B"
              stroke={stroke}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          ) : mood === 'surprised' ? (
            <ellipse cx="100" cy="117" rx="5.5" ry="7" fill={stroke} />
          ) : mood === 'sad' ? (
            <path
              d="M 92 121 Q 100 113 108 121"
              fill="none"
              stroke={stroke}
              strokeWidth="4.2"
              strokeLinecap="round"
            />
          ) : (
            /* Petit sourire mignon entre/sous les yeux */
            <path
              d="M 92 114 Q 100 123 108 114"
              fill="none"
              stroke={stroke}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Accessoire : Couronne dorée (Top 1 Leaderboard) */}
        {crown && (
          <g transform="translate(72, -6)">
            <path
              d="M 6 30 L 2 10 L 16 20 L 28 4 L 40 20 L 54 10 L 50 30 Z"
              fill="rgb(var(--gold))"
              stroke={stroke}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="3" r="3.5" fill="rgb(var(--gold))" stroke={stroke} strokeWidth="2.5" />
            <circle cx="2" cy="9" r="3" fill="rgb(var(--gold))" stroke={stroke} strokeWidth="2.5" />
            <circle cx="54" cy="9" r="3" fill="rgb(var(--gold))" stroke={stroke} strokeWidth="2.5" />
          </g>
        )}

        {/* Accessoire : Toque de diplômé (Logo / Splash / Examen) */}
        {graduationCap && (
          <g transform="translate(58, -12)">
            <polygon
              points="42,4 82,20 42,36 2,20"
              fill={stroke}
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M 20 28 L 20 42 C 20 48, 64 48, 64 42 L 64 28"
              fill={stroke}
            />
            <path
              d="M 74 23 L 78 42"
              stroke="rgb(var(--gold))"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="78" cy="44" r="3.5" fill="rgb(var(--gold))" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Mascotte qui dépasse du bas d'un conteneur (Splash Screen, Cartes Battle AIP vs ARI).
 */
export function PeekingMascot({
  color,
  size = 220,
  emphasis = true,
  className,
}: {
  color?: string;
  size?: number;
  emphasis?: boolean;
  className?: string;
}) {
  const fill = color ?? 'rgb(var(--brand-light))';
  const stroke = 'rgb(var(--ink))';
  return (
    <div className={cn('relative inline-flex items-end justify-center overflow-hidden select-none', className)} style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 240 150" className="h-full w-full overflow-visible">
        {emphasis && (
          <g stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round">
            <line x1="186" y1="26" x2="200" y2="4" />
            <line x1="204" y1="38" x2="224" y2="20" />
          </g>
        )}
        <path
          d="
            M 12 165
            C 2 130, 18 96, 48 94
            C 50 56, 86 40, 116 58
            C 142 36, 188 50, 188 88
            C 218 96, 228 132, 214 165
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        {/* Grands yeux globuleux */}
        <ellipse cx="98" cy="112" rx="22" ry="26" fill="#FFFFFF" stroke={stroke} strokeWidth="5" />
        <ellipse cx="142" cy="112" rx="22" ry="26" fill="#FFFFFF" stroke={stroke} strokeWidth="5" />
        <ellipse cx="101" cy="113" rx="14.5" ry="17.5" fill="#0D1322" />
        <circle cx="95" cy="105" r="5.5" fill="#FFFFFF" />
        <circle cx="106" cy="121" r="2.6" fill="#FFFFFF" />
        <ellipse cx="139" cy="113" rx="14.5" ry="17.5" fill="#0D1322" />
        <circle cx="133" cy="105" r="5.5" fill="#FFFFFF" />
        <circle cx="144" cy="121" r="2.6" fill="#FFFFFF" />
        {/* Petit sourire */}
        <path d="M 112 140 Q 120 148 128 140" fill="none" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Médaillon avatar rond avec mini-mascotte (Profil, Classement rangs 4+, Posts Actualités).
 */
export function MascotAvatar({
  mood = 'idle',
  size = 44,
  color,
  bgColor,
  ring = false,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  color?: string;
  bgColor?: string;
  ring?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-soft',
        ring && 'ring-4 ring-brand/25 border-2 border-brand',
        className,
      )}
      style={{ width: size, height: size, background: bgColor }}
    >
      <Mascot mood={mood} size={Math.round(size * 0.9)} color={color} animate={false} />
    </div>
  );
}
