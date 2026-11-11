import React from 'react';
import './Loader.css';

export interface LoaderProps {
  /**
   * Taille du spinner (ex: '3.5rem', '5.8rem', 48 ou 'sm' | 'md' | 'lg')
   * Par défaut: '5.8rem'
   */
  size?: number | string;
  /**
   * Vitesse de rotation (ex: '0.9s', '1.2s')
   * Par défaut: '0.9s'
   */
  speed?: string;
  /**
   * Couleur principale des pastilles (par défaut: couleur `--brand` du thème actif)
   */
  color?: string;
  /**
   * Classes CSS additionnelles pour le conteneur
   */
  className?: string;
  /**
   * Libellé optionnel affiché sous le spinner
   */
  label?: string;
}

function resolveSize(size?: number | string): string {
  if (!size) return '5.8rem';
  if (typeof size === 'number') return `${size}px`;
  if (size === 'sm') return '2.5rem';
  if (size === 'md') return '4rem';
  if (size === 'lg') return '5.8rem';
  return size;
}

export const Loader: React.FC<LoaderProps> = ({
  size = '5.8rem',
  speed = '0.9s',
  color,
  className = '',
  label,
}) => {
  const inlineStyles: React.CSSProperties = {
    ['--uib-size' as string]: resolveSize(size),
    ['--uib-speed' as string]: speed,
    ...(color ? { ['--uib-color' as string]: color } : {}),
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="dot-spinner" style={inlineStyles} role="status" aria-label={label || 'Chargement en cours'}>
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
        <div className="dot-spinner__dot" />
      </div>
      {label && (
        <span className="font-display text-sm font-extrabold text-ink animate-pulse text-center">
          {label}
        </span>
      )}
    </div>
  );
};

export default Loader;
