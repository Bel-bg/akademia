import { memo, useState, ReactNode } from 'react';

/**
 * Regex capturant les émojis simples, avec sélecteur de variante et séquences ZWJ.
 */
export const EMOJI_REGEX =
  /((?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)+)/u;

/**
 * Convertit un caractère émoji Unicode en son code hexadécimal pour le CDN.
 * Ex: '🔥' -> '1f525', '⚠️' -> '26a0_fe0f'
 */
export function getEmojiCodePoint(emoji: string): string {
  const codes: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp && cp !== 0xfe0e) {
      codes.push(cp.toString(16).toLowerCase());
    }
  }
  return codes.join('_');
}

/**
 * Dictionnaire d'alias pour les émojis fréquents dont le nom de fichier sur le CDN
 * peut différer (avec ou sans sélecteur \ufe0f).
 */
const NOTO_ALIASES: Record<string, string> = {
  '26a0': '26a0_fe0f', // ⚠️
  '2601': '2601_fe0f', // ☁️
  '270f': '270f_fe0f', // ✏️
  '2699': '2699_fe0f', // ⚙️
  '2764': '2764_fe0f', // ❤️
  '261d': '261d_fe0f', // ☝️
  '270c': '270c_fe0f', // ✌️
};

/**
 * Construit l'URL vers le WebP animé Google Noto (officiel, ultra-rapide via Google CDN, ~15-25 Ko).
 */
export function getAnimatedEmojiUrl(emoji: string): string {
  const code = getEmojiCodePoint(emoji);
  const resolvedCode = NOTO_ALIASES[code] || code;
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${resolvedCode}/512.webp`;
}

export interface AnimatedEmojiProps {
  emoji: string;
  className?: string;
  title?: string;
  size?: string;
}

/**
 * Composant d'émoji animé léger (WebP natif).
 * - S'adapte proportionnellement à la taille de la police grâce aux unités `em`.
 * - Chargement différé lazy + décodage asynchrone (impact CPU/batterie nul).
 * - Micro-interaction au survol (léger rebond fluide).
 * - Fallback transparent vers l'émoji système natif si le fichier n'existe pas ou en mode hors-ligne.
 */
export const AnimatedEmoji = memo(function AnimatedEmoji({
  emoji,
  className = '',
  title,
  size = '1.3em',
}: AnimatedEmojiProps) {
  const [hasError, setHasError] = useState(false);
  const trimmed = emoji.trim();

  if (!trimmed || hasError) {
    return <span className={`inline-block select-none ${className}`}>{emoji}</span>;
  }

  const url = getAnimatedEmojiUrl(trimmed);

  return (
    <img
      src={url}
      alt={trimmed}
      title={title || trimmed}
      role="img"
      aria-label={trimmed}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setHasError(true)}
      style={{ width: size, height: size }}
      className={`inline-block align-[-0.22em] mx-[0.06em] select-none object-contain transition-transform duration-200 hover:scale-125 active:scale-95 ${className}`}
    />
  );
});

/**
 * Parcourt une chaîne de caractères et transforme tous les émojis en composants AnimatedEmoji.
 * Utile pour les titres, énoncés de cartes mémoire, questions de quiz, etc.
 */
export function renderWithAnimatedEmojis(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(EMOJI_REGEX);
  if (parts.length <= 1) return text;

  return parts.map((part, index) => {
    if (!part) return null;
    if (EMOJI_REGEX.test(part)) {
      return <AnimatedEmoji key={index} emoji={part} />;
    }
    return part;
  });
}
