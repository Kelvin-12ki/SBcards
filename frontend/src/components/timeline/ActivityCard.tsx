import React from 'react';
import {
  Link2,
  Calendar,
  Camera,
  CheckSquare,
  Upload,
  Activity as ActivityIcon,
} from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import type { Activity } from '@/types/timeline';

export interface ActivityCardProps {
  activity: Activity;
}

const actionConfig: Record<
  string,
  {
    label: string;
    gradient: string;
    icon: React.ReactNode;
  }
> = {
  connected: {
    label: 'Connected',
    gradient: 'from-success/20 to-success/5 border-success/20',
    icon: <Link2 className="h-4 w-4 text-success" />,
  },
  joined_event: {
    label: 'Joined Event',
    gradient: 'from-neon-cyan/20 to-neon-cyan/5 border-neon-cyan/20',
    icon: <Calendar className="h-4 w-4 text-neon-cyan" />,
  },
  scanned_card: {
    label: 'Scanned Card',
    gradient: 'from-gold/20 to-gold/5 border-gold/20',
    icon: <Camera className="h-4 w-4 text-gold" />,
  },
  checked_in_session: {
    label: 'Checked In',
    gradient: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/20',
    icon: <CheckSquare className="h-4 w-4 text-neon-purple" />,
  },
  uploaded_card: {
    label: 'Uploaded Card',
    gradient: 'from-neon-pink/20 to-neon-pink/5 border-neon-pink/20',
    icon: <Upload className="h-4 w-4 text-neon-pink" />,
  },
};

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const config = actionConfig[activity.action] || {
    label: activity.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    gradient: 'from-surface-2 to-surface-1 border-border-subtle',
    icon: <ActivityIcon className="h-4 w-4 text-text-secondary" />,
  };

  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`
    : 'Someone';

  const initials = activity.user
    ? `${activity.user.firstName.charAt(0)}${activity.user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <div
      className={cn(
        'relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300 card-magical',
        config.gradient,
        'hover-glow-magical',
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {activity.user?.avatarUrl ? (
          <img
            src={activity.user.avatarUrl}
            alt={userName}
            className="h-10 w-10 rounded-full object-cover border border-border-subtle"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white">
            {initials}
          </div>
        )}
        {/* Action icon overlay */}
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-1 border border-border-subtle shadow-sm">
          {config.icon}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary leading-relaxed">
          <span className="font-semibold">{userName}</span>{' '}
          <span className="text-text-secondary">{config.label.toLowerCase()}</span>
        </p>
        {activity.metadata?.eventName && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">
            at {activity.metadata.eventName}
          </p>
        )}
        {activity.metadata?.targetName && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">
            with {activity.metadata.targetName}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[11px] text-text-tertiary whitespace-nowrap">
        {timeAgo(activity.createdAt)}
      </span>
    </div>
  );
};

export default ActivityCard;
