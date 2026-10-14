import React from 'react';
import { cn } from '@/utils/helpers';
import type { Recommendation } from '@/types/recommendation';
import { factorBg, factorColor, factorList, scorePercent, scoreTone } from '@/utils/matchFactors';
import Button from '@/components/ui/Button';
import MatchExplanation from './MatchExplanation';
import ConversationStarters from './ConversationStarters';

export interface EnhancedMatchCardProps {
  match: Recommendation;
  onConnect?: (userId: string) => void;
  onWhy?: (userId: string) => void;
  className?: string;
}

const TONE_TEXT = {
  high: 'text-success',
  mid: 'text-gold',
  low: 'text-neon-cyan',
} as const;

const TONE_STROKE = {
  high: 'stroke-success',
  mid: 'stroke-gold',
  low: 'stroke-neon-cyan',
} as const;

const TONE_GLOW = {
  high: 'drop-shadow(0 0 6px rgba(52,211,153,0.6))',
  mid: 'drop-shadow(0 0 6px rgba(234,179,8,0.6))',
  low: 'drop-shadow(0 0 6px rgba(0,245,255,0.6))',
} as const;

const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({
  match,
  onConnect,
  onWhy,
  className,
}) => {
  const profile = match.matchedUserProfile;
  const score = Number(match.overlapScore) || 0;
  const name = match.userName || profile?.displayName || 'Unknown User';

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const pct = scorePercent(score);
  const tone = scoreTone(score);

  // Compute the circumference for a circle with r=28
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;

  const factors = factorList(match.factors);
  const explanations = match.explanation || [];
  const starters = match.conversationStarters || [];

  return (
    <div
      className={cn(
        'card-magical rounded-2xl p-6 transition-all duration-300 hover-glow-magical shimmer-magical',
        className,
      )}
    >
      {/* Top Section: Avatar, Name, Company/Role */}
      <div className="flex items-start gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full gradient-aurora text-lg font-bold text-white shadow-lg shadow-neon-purple/20">
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
          <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
          {(profile?.jobRole || profile?.company) && (
            <p className="text-sm text-text-secondary">
              {[profile?.jobRole, profile?.company].filter(Boolean).join(' at ')}
            </p>
          )}
          {profile?.industry && (
            <p className="mt-0.5 text-xs text-text-tertiary">{profile.industry}</p>
          )}
        </div>

        {/* Match Score Ring */}
        <div className="relative flex flex-shrink-0 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-surface-3"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={TONE_STROKE[tone]}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ filter: TONE_GLOW[tone] }}
            />
          </svg>
          <span className={cn('absolute text-lg font-extrabold', TONE_TEXT[tone])}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Factor Breakdown: Horizontal Bar Chart */}
      {factors.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Match Factors
          </p>
          {factors.map((factor) => {
            const factorPercent = scorePercent(factor.score);

            return (
              <div key={factor.key} className="flex items-center gap-2">
                <span className="w-28 flex-shrink-0 text-xs text-text-secondary">
                  {factor.label}
                </span>
                <div className="flex-1">
                  <div className={cn('h-2 w-full rounded-full', factorBg(factor.key))}>
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', factorColor(factor.key))}
                      style={{ width: `${factorPercent}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 flex-shrink-0 text-right text-xs font-medium text-text-primary">
                  {factorPercent}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Explanation Section */}
      {explanations.length > 0 && (
        <div className="mt-4">
          <MatchExplanation explanation={explanations} factors={factors} compact />
        </div>
      )}

      {/* Conversation Starters Section */}
      {starters.length > 0 && (
        <div className="mt-4">
          <ConversationStarters starters={starters} compact />
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {onConnect && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConnect(match.userId)}
          >
            Connect
          </Button>
        )}
        {onWhy && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onWhy(match.userId)}
          >
            Why?
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="opacity-40 cursor-not-allowed"
        >
          Message
        </Button>
      </div>
    </div>
  );
};

export default EnhancedMatchCard;
