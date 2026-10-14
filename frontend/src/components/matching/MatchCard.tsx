import React from 'react';
import { cn, formatScore } from '@/utils/helpers';
import type { MatchResult } from '@/types/match';
import { scoreTone } from '@/utils/matchFactors';
import Badge from '@/components/ui/Badge';

export interface MatchCardProps {
  match: MatchResult;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

const TONE_BAR: Record<ReturnType<typeof scoreTone>, string> = {
  high: 'bg-success',
  mid: 'bg-gold',
  low: 'bg-neon-cyan',
};

const TONE_GLOW: Record<ReturnType<typeof scoreTone>, string> = {
  high: '0 0 10px rgba(52,211,153,0.5)',
  mid: '0 0 10px rgba(234,179,8,0.5)',
  low: '0 0 10px rgba(0,245,255,0.5)',
};

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onViewProfile,
  className,
}) => {
  const profile = match.matchedUserProfile;
  const score = Number(match.overlapScore) || 0;

  const name = match.userName || profile?.displayName || 'Unknown User';
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const tone = scoreTone(score);

  return (
    <div
      className={cn(
        'card-magical rounded-2xl p-5 transition-all duration-300 hover-glow-magical shimmer-magical',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white shadow-lg shadow-neon-purple/20">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold text-text-primary cursor-pointer hover:text-neon-cyan transition-colors"
            onClick={() => onViewProfile?.(match.userId)}
          >
            {name}
          </h3>
          {(profile?.jobRole || profile?.company) && (
            <p className="text-sm text-text-secondary">
              {[profile?.jobRole, profile?.company].filter(Boolean).join(' at ')}
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
            className={cn('h-full rounded-full transition-all duration-500', TONE_BAR[tone])}
            style={{
              width: `${Math.round(score * 100)}%`,
              boxShadow: TONE_GLOW[tone],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
