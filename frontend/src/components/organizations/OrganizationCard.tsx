import React from 'react';
import { cn } from '@/utils/helpers';
import type { Organization } from '@/types/organization';

export interface OrganizationCardProps {
  organization: Organization;
  onClick?: () => void;
  isActive?: boolean;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization, onClick, isActive }) => {
  const initials = organization.name
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
        'card-magical rounded-2xl p-5 text-left w-full transition-all duration-300',
        'hover:shadow-lg hover:shadow-neon-purple/10',
        isActive && 'border-gold border-2 shadow-lg shadow-gold/10',
        !isActive && 'border border-border-subtle',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo / Fallback initials */}
        {organization.logoUrl ? (
          <img
            src={organization.logoUrl}
            alt={organization.name}
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="gradient-magical flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-text-primary truncate">{organization.name}</h3>

          {organization.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {organization.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Members
            </span>

            {organization.website && (
              <span className="flex items-center gap-1 truncate">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="truncate">{organization.website}</span>
              </span>
            )}
          </div>
        </div>

        {isActive && (
          <div className="flex-shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20">
              <svg className="h-3.5 w-3.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export default OrganizationCard;
