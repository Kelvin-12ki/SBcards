import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import Avatar from '@/components/ui/Avatar';

interface AdminNavbarProps {
  onMenuToggle: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border-subtle bg-surface-1/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors lg:hidden"
          aria-label="Toggle sidebar menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Logo */}
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/20">
            <svg className="h-4 w-4 text-gold-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-gradient-gold hidden sm:inline">Admin</span>
        </Link>

        {/* Breadcrumb separator */}
        <span className="text-text-tertiary hidden sm:inline">/</span>
        <span className="text-sm text-text-secondary hidden sm:inline">Panel</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          View App
        </Link>

        <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
          <Avatar size="sm" fallbackInitials={initials} />
          <div className="hidden md:block">
            <p className="text-xs font-medium text-text-primary">{user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-text-tertiary">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
