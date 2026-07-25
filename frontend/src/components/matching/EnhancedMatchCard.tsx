import React from 'react';
import { cn } from '@/utils/helpers';
import type { Recommendation } from '@/types/recommendation';
import Button from '@/components/ui/Button';
import MatchExplanation from './MatchExplanation';
import ConversationStarters from './ConversationStarters';

export interface EnhancedMatchCardProps {
  match: Recommendation;
  onConnect?: (userId: string) => void;
  onWhy?: (userId: string) => void;
  className?: string;
}

const FACTOR_COLORS: Record<string, string> = {
  industry: 'bg-gold',
  skills: 'bg-neon-cyan',
  interests: 'bg-neon-pink',
  complementarity: 'bg-neon-purple',
  seniority: 'bg-neon-blue',
  location: 'bg-success',
};

const FACTOR_BG_COLORS: Record<string, string> = {
  industry: 'bg-gold/20',
  skills: 'bg-neon-cyan/20',
  interests: 'bg-neon-pink/20',
  complementarity: 'bg-neon-purple/20',
  seniority: 'bg-neon-blue/20',
  location: 'bg-success/20',
};

const factorLabels: Record<string, string> = {
  industry: 'Industry',
  skills: 'Skills',
  interests: 'Interests',
  complementarity: 'Complementarity',
  seniority: 'Seniority',
  location: 'Location',
};

const EnhancedMatchCard: React.FC<EnhancedMatchCardProps> = ({
  match,
  onConnect,
  onWhy,
  className,
}) => {
  const user = match.targetUser;
  const score = match.matchScore;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const scorePercent = Math.round(score * 100);
  const scoreColor =
    scorePercent >= 80
      ? 'text-success'
      : scorePercent >= 60
        ? 'text-gold'
        : 'text-neon-cyan';

  const ringColor =
    scorePercent >= 80
      ? 'stroke-success'
      : scorePercent >= 60
        ? 'stroke-gold'
        : 'stroke-neon-cyan';

  // Compute the circumference for a circle with r=28
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (scorePercent / 100) * circumference;

  const factors = match.factors || [];
  const explanations = match.explanations || [];
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
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-text-primary">
            {user?.displayName || 'Unknown User'}
          </h3>
          {(user?.company || user?.title) && (
            <p className="text-sm text-text-secondary">
              {[user?.title, user?.company].filter(Boolean).join(' at ')}
            </p>
          )}
          {user?.industry && (
            <p className="mt-0.5 text-xs text-text-tertiary">{user.industry}</p>
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
              className={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                filter: scorePercent >= 80
                  ? 'drop-shadow(0 0 6px rgba(52,211,153,0.6))'
                  : scorePercent >= 60
                    ? 'drop-shadow(0 0 6px rgba(212,168,83,0.6))'
                    : 'drop-shadow(0 0 6px rgba(0,245,255,0.6))',
              }}
            />
          </svg>
          <span className={cn('absolute text-lg font-extrabold', scoreColor)}>
            {scorePercent}%
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
            const key = factor.name.toLowerCase().replace(/\s+/g, '');
            const colorClass = FACTOR_COLORS[key] || 'bg-neon-cyan';
            const bgClass = FACTOR_BG_COLORS[key] || 'bg-surface-3';
            const label = factorLabels[key] || factor.name;
            const factorPercent = Math.round((factor.score || 0) * 100);

            return (
              <div key={factor.name} className="flex items-center gap-2">
                <span className="w-28 flex-shrink-0 text-xs text-text-secondary">
                  {label}
                </span>
                <div className="flex-1">
                  <div className={cn('h-2 w-full rounded-full', bgClass)}>
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', colorClass)}
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
            onClick={() => onConnect(user?.id || match.targetUserId)}
          >
            Connect
          </Button>
        )}
        {onWhy && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onWhy(user?.id || match.targetUserId)}
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
