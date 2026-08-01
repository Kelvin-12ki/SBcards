import React, { useState } from 'react';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import type { Conversation } from '@/types/messaging';

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  currentUserId: _currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? conversations.filter((conv) => {
        const q = searchQuery.toLowerCase();
        const name = conv.otherUser?.displayName || conv.otherUser?.email || '';
        return name.toLowerCase().includes(q);
      })
    : conversations;

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="mb-5 rounded-3xl gradient-magical p-6 text-white animate-glow-pulse">
          <MessageSquare className="h-10 w-10" />
        </div>
        <h3 className="font-display text-xl font-bold text-gradient-gold">Your Messages</h3>
        <p className="mt-2.5 text-sm text-text-secondary max-w-xs leading-relaxed">
          Connect with people at events to start networking in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Search */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border-subtle px-3 py-2.5 search-glow transition-all duration-200">
          <Search className="h-4 w-4 text-text-tertiary flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>
      </div>

      {/* New Message button */}
      <div className="px-3 pb-2">
        <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-strong px-4 py-2.5 text-sm font-semibold text-gold-ink transition-all duration-200 hover-glow-gold active:scale-[0.98]">
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex flex-col gap-0.5 px-2">
        {filtered.map((conv) => {
          const isActive = conv.id === activeId;
          const otherUser = conv.otherUser;
          const displayName = otherUser?.displayName
            || (otherUser ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') : '')
            || otherUser?.email
            || 'Unknown User';
          const hasUnread = conv.unreadCount && conv.unreadCount > 0;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'relative flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 w-full',
                isActive
                  ? 'bg-surface-2 border-l-[3px] border-l-gold'
                  : 'hover:bg-surface-2/60 border-l-[3px] border-l-transparent',
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar
                  src={otherUser?.avatarUrl}
                  alt={displayName}
                  size="md"
                  className={cn(
                    'border border-border-subtle transition-all duration-200',
                    isActive && 'ring-2 ring-gold/40',
                  )}
                  fallbackInitials={displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                />
                {hasUnread && (
                  <div className="unread-pulse absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-ink shadow-lg shadow-gold/30">
                    {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'text-sm truncate',
                      hasUnread ? 'font-bold text-text-primary' : 'font-medium text-text-primary',
                    )}
                  >
                    {displayName}
                  </span>
                  {conv.lastMessageAt && (
                    <span className={cn(
                      'flex-shrink-0 text-[11px]',
                      hasUnread ? 'text-gold font-medium' : 'text-text-tertiary',
                    )}>
                      {timeAgo(conv.lastMessageAt)}
                    </span>
                  )}
                </div>
                {otherUser?.company && (
                  <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{otherUser.company}</p>
                )}
                {conv.lastMessagePreview && (
                  <div className="relative mt-0.5 max-w-full fade-truncate">
                    <p
                      className={cn(
                        'text-xs truncate',
                        hasUnread
                          ? 'text-text-primary font-medium'
                          : 'text-text-secondary',
                      )}
                    >
                      {conv.lastMessagePreview}
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
