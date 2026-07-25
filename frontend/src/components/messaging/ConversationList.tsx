import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
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
  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="mb-4 rounded-2xl gradient-magical p-4 text-white animate-glow-pulse">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="font-display text-lg font-bold text-gradient-magical">No conversations yet</h3>
        <p className="mt-2 text-sm text-text-secondary max-w-xs">
          Start networking! Connect with people at events to begin chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const otherUser = conv.otherUser;
        const displayName = otherUser?.displayName
          || (otherUser ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') : '')
          || otherUser?.email
          || 'Unknown User';

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'relative flex items-start gap-3 rounded-2xl p-3.5 sm:p-3 text-left transition-all duration-200 card-magical min-h-[64px]',
              isActive
                ? 'border-gold/50 border-glow-gold'
                : 'border-border-subtle hover:border-neon-purple/30 hover-glow-magical',
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={displayName}
                  className="h-11 w-11 rounded-full object-cover border border-border-subtle"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-magical text-sm font-bold text-white">
                  {displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              {conv.unreadCount && conv.unreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-ink shadow-lg shadow-gold/30">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold truncate',
                    conv.unreadCount && conv.unreadCount > 0 ? 'text-text-primary' : 'text-text-primary',
                  )}
                >
                  {displayName}
                </span>
                {conv.lastMessageAt && (
                  <span className="flex-shrink-0 text-[11px] text-text-tertiary">
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              {otherUser?.company && (
                <p className="text-xs text-text-tertiary mt-0.5 truncate">{otherUser.company}</p>
              )}
              {conv.lastMessagePreview && (
                <p
                  className={cn(
                    'text-xs mt-1 truncate',
                    conv.unreadCount && conv.unreadCount > 0
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary',
                  )}
                >
                  {conv.lastMessagePreview}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
