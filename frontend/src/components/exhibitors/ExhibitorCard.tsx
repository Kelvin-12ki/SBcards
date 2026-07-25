import React from 'react';
import { cn } from '@/utils/helpers';
import type { Exhibitor } from '@/types/exhibitor';

export interface ExhibitorCardProps {
  exhibitor: Exhibitor;
  onClick?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const gradientColors = [
  'from-neon-cyan/30 to-neon-blue/30',
  'from-neon-pink/30 to-neon-purple/30',
  'from-gold/30 to-neon-pink/30',
  'from-neon-purple/30 to-neon-cyan/30',
  'from-aurora-green/30 to-aurora-teal/30',
  'from-aurora-blue/30 to-aurora-purple/30',
];

function getGradient(index: number): string {
  return gradientColors[index % gradientColors.length];
}

const ExhibitorCard: React.FC<ExhibitorCardProps> = ({ exhibitor, onClick }) => {
  const hasLogo = !!exhibitor.logoUrl;

  return (
    <div
      onClick={onClick}
      className={cn(
        'card-magical rounded-xl p-5 transition-all duration-300 hover-glow-magical cursor-pointer',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo or Initials */}
        {hasLogo ? (
          <img
            src={exhibitor.logoUrl}
            alt={`${exhibitor.companyName} logo`}
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              getGradient(exhibitor.companyName.length),
            )}
          >
            <span className="text-lg font-bold text-white">
              {getInitials(exhibitor.companyName)}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="font-display text-base font-bold text-text-primary truncate">
            {exhibitor.companyName}
          </h4>
          {exhibitor.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {exhibitor.description}
            </p>
          )}
        </div>
      </div>

      {/* Products & Services badges */}
      {(exhibitor.products?.length > 0 || exhibitor.services?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exhibitor.products.slice(0, 3).map((p) => (
            <span
              key={p}
              className="inline-flex items-center rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[11px] font-medium text-neon-cyan"
            >
              {p}
            </span>
          ))}
          {exhibitor.services.slice(0, 2).map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full bg-neon-purple/10 px-2 py-0.5 text-[11px] font-medium text-neon-purple"
            >
              {s}
            </span>
          ))}
          {(exhibitor.products.length > 3 || exhibitor.services.length > 2) && (
            <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-tertiary">
              +{exhibitor.products.length + exhibitor.services.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Booth info */}
      {(exhibitor.boothNumber || exhibitor.boothLocation) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <span>
            {exhibitor.boothNumber && `Booth ${exhibitor.boothNumber}`}
            {exhibitor.boothNumber && exhibitor.boothLocation && ' · '}
            {exhibitor.boothLocation}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary border-t border-border-subtle pt-3">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          {exhibitor.visitorCount} visitors
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          {exhibitor.leadCount} leads
        </span>
      </div>
    </div>
  );
};

export default ExhibitorCard;
