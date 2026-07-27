import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cn } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/api/notifications';
import type { Notification } from '@/types/notification';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationPanel from '@/components/notifications/NotificationPanel';

export interface NavbarProps {
  onMenuToggle?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and poll
  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const { count } = await getUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // Silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Fetch full notification list when panel opens
  useEffect(() => {
    if (!notificationPanelOpen) return;
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(1, 20);
        if (!cancelled) setNotifications(data);
      } catch {
        // Silently fail
      }
    };
    fetchNotifications();
    return () => { cancelled = true; };
  }, [notificationPanelOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <nav className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface-1 px-5 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden rounded-xl p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          aria-label="Toggle sidebar menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-extrabold tracking-tight text-text-primary">
            SB<span className="text-gradient-gold">Cards</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <NotificationBell
            count={unreadCount}
            onClick={() => setNotificationPanelOpen((prev) => !prev)}
          />
          {notificationPanelOpen && (
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDelete}
              onClose={() => setNotificationPanelOpen(false)}
            />
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-surface-2"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="relative">
              <Avatar size="sm" fallbackInitials={initials} />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-1 bg-success animate-glow-pulse" />
            </div>
            <span className="hidden text-sm font-medium text-text-primary sm:block">
              {user?.displayName || user?.email}
            </span>
            <svg
              className={cn(
                'h-4 w-4 text-text-tertiary transition-transform duration-200',
                dropdownOpen && 'rotate-180',
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-subtle bg-surface-1 py-1 shadow-2xl">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary rounded-xl mx-1"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary rounded-xl mx-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
