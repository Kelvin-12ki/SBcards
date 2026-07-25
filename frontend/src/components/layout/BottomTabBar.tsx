import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Users, Search, User } from 'lucide-react';

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomTabBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface-1/95 backdrop-blur-xl border-t border-border-subtle">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-neon-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomTabBar;
