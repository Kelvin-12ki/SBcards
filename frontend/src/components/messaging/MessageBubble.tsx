import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import type { Message } from '@/types/messaging';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, senderName }) => {
  return (
    <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      {/* Sender name for other users */}
      {!isOwn && senderName && (
        <span className="text-xs text-text-tertiary px-1">{senderName}</span>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md',
          isOwn
            ? 'bg-gradient-to-r from-gold to-gold-strong text-gold-ink rounded-br-md'
            : 'bg-surface-2 text-text-primary border border-border-subtle rounded-bl-md',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {/* Time + read indicator */}
      <div className={cn('flex items-center gap-1 px-1', isOwn ? 'flex-row' : 'flex-row-reverse')}>
        <span className="text-[10px] text-text-tertiary">{timeAgo(message.createdAt)}</span>
        {isOwn && (
          message.read ? (
            <CheckCheck className="h-3 w-3 text-neon-cyan" />
          ) : (
            <Check className="h-3 w-3 text-text-tertiary" />
          )
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
