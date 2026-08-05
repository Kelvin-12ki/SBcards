import React from 'react';
import { cn } from '@/utils/helpers';

interface FollowUpStatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'no_follow_up' | undefined;
  className?: string;
}

const statusConfig = {
  not_started: { label: 'Not started', classes: 'bg-surface-3 text-text-tertiary', dot: 'bg-text-tertiary' },
  in_progress: { label: 'In progress', classes: 'bg-yellow-500/10 text-yellow-400', dot: 'bg-yellow-400 animate-pulse' },
  completed: { label: 'Completed', classes: 'bg-green-500/10 text-green-400', dot: 'bg-green-400' },
  no_follow_up: { label: 'No follow-up', classes: 'bg-surface-3 text-text-tertiary', dot: 'bg-text-tertiary' },
};

const FollowUpStatusBadge: React.FC<FollowUpStatusBadgeProps> = ({ status, className }) => {
  if (!status) return null;
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium',
        config.classes,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

export default FollowUpStatusBadge;
