import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl p-2 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-ink',
            'shadow-lg shadow-gold/30 animate-glow-pulse',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
