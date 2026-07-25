import React from 'react';
import { cn, formatScore } from '@/utils/helpers';
import type { Match } from '@/types/match';
import Badge from '@/components/ui/Badge';

export interface MatchCardProps {
  match: Match;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onViewProfile,
  className,
}) => {
  const matchedUser = match.matchedUser;
  const matchedCard = match.matchedCard;
  const score = match.overlapScore;

  const initials = matchedUser?.displayName
    ? matchedUser.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const scoreColor =
    score >= 0.8 ? 'bg-success' : score >= 0.5 ? 'bg-warning' : 'bg-danger';

  return (
    <div
      className={cn(
        'card-magical rounded-2xl p-5 transition-all duration-300 hover-glow-magical shimmer-magical',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white shadow-lg shadow-neon-purple/20">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold text-text-primary cursor-pointer hover:text-neon-cyan transition-colors"
            onClick={() => onViewProfile?.(matchedUser?.id || match.userBId)}
          >
            {matchedUser?.displayName || 'Unknown User'}
          </h3>
          {(matchedCard?.company || matchedCard?.role) && (
            <p className="text-sm text-text-secondary">
              {[matchedCard?.company, matchedCard?.role].filter(Boolean).join(' | ')}
            </p>
          )}

          {match.sharedKeywords && match.sharedKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {match.sharedKeywords.map((keyword, i) => (
                <Badge key={i} variant="primary">{keyword}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Match Score</span>
          <span className="font-semibold text-text-primary">{formatScore(score)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className={cn('h-full rounded-full transition-all duration-500', scoreColor)}
            style={{
              width: `${Math.round(score * 100)}%`,
              boxShadow: score >= 0.8 ? '0 0 10px rgba(52,211,153,0.5)' : score >= 0.5 ? '0 0 10px rgba(251,191,36,0.5)' : '0 0 10px rgba(248,113,113,0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
