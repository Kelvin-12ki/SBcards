import React from 'react';
import Avatar from '@/components/ui/Avatar';

interface TypingIndicatorProps {
  name?: string;
  avatarUrl?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name, avatarUrl }) => {
  return (
    <div className="flex items-start gap-2.5 px-1 py-1 animate-message-in">
      <Avatar
        src={avatarUrl}
        alt={name || 'User'}
        size="sm"
        className="border border-border-subtle flex-shrink-0 mt-1"
        fallbackInitials={name ? name[0].toUpperCase() : '?'}
      />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md glass-subtle px-4 py-3 border border-border-subtle">
        <div className="flex items-center gap-1">
          <span className="typing-dot" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot" style={{ animationDelay: '150ms' }} />
          <span className="typing-dot" style={{ animationDelay: '300ms' }} />
        </div>
        {name && (
          <span className="text-xs text-text-secondary ml-1">{name} is typing</span>
        )}
      </div>
    </div>
  );
};

export default TypingIndicator;
