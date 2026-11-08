import React from 'react';
import { FiliereId } from '@/state/Theme';
import { cn } from '@/lib/utils';

export interface CustomAvatarProps {
  name?: string | null;
  filiere?: FiliereId | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'AK';
  const clean = name.trim().replace(/[^\p{L}\p{N}\s_\-]/gu, '');
  const parts = clean.split(/[\s_\-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }
  return 'AK';
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 84,
};

export function CustomAvatar({
  name,
  filiere,
  size = 'md',
  className,
  showBadge = false,
}: CustomAvatarProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 40;
  const initials = getInitials(name);
  const isAip = filiere === 'AIP';

  // Palette par filière : AIP -> Violet (#7C3AED), ARI -> Rouge/Corail (#FF574A, par défaut)
  const bgGradient = isAip
    ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
    : 'linear-gradient(135deg, #FF6F61 0%, #E11D48 100%)';

  const borderColor = isAip ? 'rgba(237, 233, 254, 0.9)' : 'rgba(254, 226, 226, 0.9)';
  const shadowColor = isAip ? '0 4px 12px rgba(124, 58, 237, 0.35)' : '0 4px 12px rgba(255, 87, 74, 0.35)';

  const fontSize = Math.max(10, Math.round(pixelSize * 0.42));

  return (
    <div
      className={cn('relative inline-flex flex-shrink-0 items-center justify-center select-none', className)}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-display font-extrabold text-white transition-transform hover:scale-105"
        style={{
          background: bgGradient,
          fontSize: `${fontSize}px`,
          border: `${Math.max(1.5, Math.round(pixelSize / 18))}px solid ${borderColor}`,
          boxShadow: shadowColor,
          letterSpacing: '-0.02em',
        }}
        aria-label={name ? `Avatar de ${name}` : 'Avatar étudiant'}
      >
        <span>{initials}</span>
      </div>

      {showBadge && filiere && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full font-black text-white ring-2 ring-card shadow-sm',
            isAip ? 'bg-[#7C3AED]' : 'bg-[#FF574A]',
          )}
          style={{
            fontSize: `${Math.max(8, Math.round(pixelSize * 0.22))}px`,
            padding: `${Math.max(1, Math.round(pixelSize * 0.04))}px ${Math.max(3, Math.round(pixelSize * 0.1))}px`,
          }}
        >
          {filiere}
        </span>
      )}
    </div>
  );
}
