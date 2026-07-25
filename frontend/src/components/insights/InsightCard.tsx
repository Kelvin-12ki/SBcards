import React from 'react';
import { Heart, UserPlus, Clock, Users, Sparkles, Lightbulb, X } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { timeAgo } from '@/utils/helpers';
import type { Insight } from '@/types/insight';
import Button from '@/components/ui/Button';

export interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  onAction?: (insight: Insight) => void;
  className?: string;
}

const typeConfig: Record<
  Insight['type'],
  {
    gradient: string;
    icon: React.ReactNode;
    borderGlow: string;
    actionLabel?: string;
  }
> = {
  relationship_strength: {
    gradient: 'from-neon-blue/10 to-neon-cyan/5',
    icon: <Heart className="h-5 w-5 text-neon-blue" />,
    borderGlow: 'hover:border-neon-blue/30',
    actionLabel: 'View Connection',
  },
  networking_suggestion: {
    gradient: 'from-success/10 to-success/5',
    icon: <UserPlus className="h-5 w-5 text-success" />,
    borderGlow: 'hover:border-success/30',
    actionLabel: 'Connect',
  },
  follow_up_reminder: {
    gradient: 'from-gold/10 to-gold/5',
    icon: <Clock className="h-5 w-5 text-gold" />,
    borderGlow: 'hover:border-gold/30',
    actionLabel: 'Send Message',
  },
  common_connection: {
    gradient: 'from-neon-cyan/10 to-neon-cyan/5',
    icon: <Users className="h-5 w-5 text-neon-cyan" />,
    borderGlow: 'hover:border-neon-cyan/30',
    actionLabel: 'View Mutuals',
  },
  mutual_interest: {
    gradient: 'from-neon-purple/10 to-neon-purple/5',
    icon: <Sparkles className="h-5 w-5 text-neon-purple" />,
    borderGlow: 'hover:border-neon-purple/30',
    actionLabel: 'Explore Interests',
  },
  profile_tip: {
    gradient: 'from-neon-pink/10 to-neon-pink/5',
    icon: <Lightbulb className="h-5 w-5 text-neon-pink" />,
    borderGlow: 'hover:border-neon-pink/30',
    actionLabel: 'Improve Profile',
  },
};

const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss, onAction, className }) => {
  const config = typeConfig[insight.type];
  if (!config) return null;

  const renderDataPreview = () => {
    switch (insight.type) {
      case 'relationship_strength': {
        const strength = insight.data?.strength ?? 0;
        const strengthPercent = Math.round(strength * 100);
        return (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span>Connection Strength</span>
              <span>{strengthPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all duration-500"
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>
        );
      }
      case 'networking_suggestion': {
        const suggestedUser = insight.data?.suggestedUserName;
        const reason = insight.data?.reason;
        return (
          <div className="mt-2 text-xs text-text-secondary">
            {suggestedUser && (
              <p>
                <span className="font-semibold text-text-primary">{suggestedUser}</span>
                {reason && ` — ${reason}`}
              </p>
            )}
          </div>
        );
      }
      case 'follow_up_reminder': {
        const connectionName = insight.data?.connectionName;
        const daysSince = insight.data?.daysSinceContact;
        return (
          <div className="mt-2 text-xs text-text-secondary">
            {connectionName && (
              <p>
                <span className="font-semibold text-text-primary">{connectionName}</span>
                {daysSince !== undefined && ` — ${daysSince} day${daysSince !== 1 ? 's' : ''} since last contact`}
              </p>
            )}
          </div>
        );
      }
      case 'common_connection': {
        const count = insight.data?.mutualCount ?? 0;
        return (
          <div className="mt-2 text-xs text-text-secondary">
            <p>
              <span className="font-bold text-neon-cyan">{count}</span> mutual connection{count !== 1 ? 's' : ''}
            </p>
          </div>
        );
      }
      case 'mutual_interest': {
        const interests: string[] = insight.data?.interests ?? [];
        return (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {interests.slice(0, 4).map((interest, i) => (
              <span
                key={i}
                className="rounded-full bg-neon-purple/10 px-2 py-0.5 text-[10px] font-medium text-neon-purple"
              >
                {interest}
              </span>
            ))}
            {interests.length > 4 && (
              <span className="text-[10px] text-text-tertiary">+{interests.length - 4} more</span>
            )}
          </div>
        );
      }
      case 'profile_tip': {
        const tip = insight.data?.tip;
        return (
          <div className="mt-2 text-xs text-text-secondary">
            <p>{tip || insight.description}</p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 p-4 transition-all duration-300 card-magical',
        config.gradient,
        config.borderGlow,
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            {config.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-text-primary">{insight.title}</h4>
            {insight.description && (
              <p className="mt-0.5 text-xs text-text-secondary">{insight.description}</p>
            )}
            <p className="mt-1 text-[10px] text-text-tertiary">{timeAgo(insight.createdAt)}</p>
          </div>
        </div>

        <button
          onClick={() => onDismiss(insight.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-tertiary opacity-0 transition-all hover:bg-surface-2 hover:text-text-primary group-hover:opacity-100"
          aria-label="Dismiss insight"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Type-specific content */}
      {renderDataPreview()}

      {/* Action button */}
      {onAction && config.actionLabel && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction(insight)}
            className="text-xs"
          >
            {config.actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
