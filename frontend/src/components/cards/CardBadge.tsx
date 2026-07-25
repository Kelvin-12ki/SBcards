import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface CardBadgeProps {
  card: Card;
  onClick?: () => void;
  isDefault?: boolean;
  className?: string;
}

const CardBadge: React.FC<CardBadgeProps> = ({
  card,
  onClick,
  isDefault = false,
  className,
}) => {
  const initials = card.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 text-left transition-all duration-300',
        'hover-glow-magical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan',
        className,
      )}
    >
      {isDefault && (
        <div className="absolute right-3 top-3">
          <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}

      {card.avatarUrl ? (
        <img
          src={card.avatarUrl}
          alt={card.fullName}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{card.fullName}</p>
        {card.headline && (
          <p className="truncate text-xs text-text-secondary">{card.headline}</p>
        )}
        {card.company && (
          <p className="truncate text-xs text-text-tertiary">{card.company}</p>
        )}
      </div>
    </button>
  );
};

export default CardBadge;
