import { ReactNode } from 'react';
import { Inline } from './Markdown';
import { GlassesCloud } from './GlassesCloud';
import { cn } from '@/lib/utils';

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1 py-1.5 text-muted" aria-label="Nimbo écrit…">
      <i className="typing-dot" /><i className="typing-dot" /><i className="typing-dot" />
    </span>
  );
}

/** Bulle de Nimbo (avec son petit avatar sur la première bulle d'une série). */
export function CoachBubble({
  text,
  children,
  avatar = true,
  color,
  typing = false,
}: {
  text?: string;
  children?: ReactNode;
  avatar?: boolean;
  color?: string;
  typing?: boolean;
}) {
  return (
    <div className="bubble-in flex items-end gap-2.5">
      <div className="w-11 shrink-0">
        {avatar && <GlassesCloud size={44} color={color} talking={typing} bob={false} />}
      </div>
      <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-card px-4 py-3 text-[15px] font-semibold leading-relaxed text-ink shadow-card ring-1 ring-line/60">
        {typing ? <TypingDots /> : text ? <Inline text={text} /> : children}
      </div>
    </div>
  );
}

export function UserBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="bubble-in flex justify-end">
      <div className={cn('max-w-[85%] rounded-3xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] font-bold text-white shadow-btn-brand', className)}>
        {children}
      </div>
    </div>
  );
}
