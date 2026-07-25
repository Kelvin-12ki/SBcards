import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  UserPlus,
  MessageSquare,
  Calendar,
  Link2,
  Upload,
  Camera,
  X,
  CheckCheck,
} from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import type { Notification } from '@/types/notification';

export interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const typeIconMap: Record<string, React.ReactNode> = {
  connection: <UserPlus className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  match: <Link2 className="h-4 w-4" />,
  card_scanned: <Camera className="h-4 w-4" />,
  card_uploaded: <Upload className="h-4 w-4" />,
};

const typeColorMap: Record<string, string> = {
  connection: 'text-success',
  message: 'text-neon-cyan',
  event: 'text-gold',
  match: 'text-neon-purple',
  card_scanned: 'text-gold',
  card_uploaded: 'text-neon-pink',
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay registering to avoid immediate close from toggle button
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 md:w-96 rounded-2xl border border-border-subtle bg-surface-1/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold/20 px-1.5 text-[10px] font-bold text-gold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="mb-3 rounded-2xl gradient-magical p-3 text-white animate-glow-pulse">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-text-primary">You&apos;re all caught up!</p>
            <p className="mt-1 text-xs text-text-secondary">No new notifications.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                  if (notification.link) {
                    navigate(notification.link);
                  }
                  onClose();
                }}
                className={cn(
                  'group relative flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2',
                  !notification.read && 'bg-surface-2/50',
                )}
              >
                {/* Unread left border */}
                {!notification.read && (
                  <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gold" />
                )}

                {/* Type icon */}
                <div
                  className={cn(
                    'flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full',
                    typeColorMap[notification.type] || 'text-text-secondary',
                    'bg-surface-2',
                  )}
                >
                  {typeIconMap[notification.type] || <Bell className="h-4 w-4" />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary leading-snug">
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{notification.body}</p>
                  )}
                  <span className="text-[10px] text-text-tertiary mt-1 block">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="flex-shrink-0 rounded-full p-1 text-text-tertiary opacity-0 group-hover:opacity-100 transition-all hover:bg-surface-3 hover:text-danger"
                  aria-label="Delete notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
