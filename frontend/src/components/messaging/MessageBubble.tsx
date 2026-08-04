import React, { useState } from 'react';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import type { Message } from '@/types/messaging';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onDelete?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  senderName,
  isFirstInGroup = true,
  isLastInGroup = true,
  onDelete,
}) => {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={cn(
        'flex flex-col animate-message-in group/msg',
        isOwn ? 'items-end' : 'items-start',
        isFirstInGroup ? 'mt-2' : 'mt-0.5',
      )}
    >
      {/* Sender name for other users — only show for first in group */}
      {!isOwn && senderName && isFirstInGroup && (
        <span className="text-[11px] font-medium text-gold/70 px-1 mb-0.5">{senderName}</span>
      )}

      {/* Bubble */}
      <div className="relative">
        <div
          className={cn(
            'relative w-fit max-w-[80%] px-4 py-2.5 text-sm leading-relaxed',
            isOwn
              ? cn(
                  'bg-gradient-to-r from-gold to-gold-strong text-gold-ink',
                  isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-br-md',
                  isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-br-lg',
                  !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tr-lg rounded-br-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-r-lg',
                )
              : cn(
                  'bg-surface-2 text-text-primary border border-border-subtle',
                  isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-bl-md',
                  isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-bl-lg',
                  !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tl-lg rounded-bl-md',
                  !isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-l-lg',
                ),
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Delete button — only on own messages, appears on hover */}
        {isOwn && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(message.id);
            }}
            className="absolute -top-2 -left-8 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 flex items-center justify-center h-6 w-6 rounded-full bg-surface-3 border border-border-subtle text-text-tertiary hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10"
            aria-label="Delete message"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Time + read indicator — only show for last in group */}
      {isLastInGroup && (
        <div className={cn('flex items-center gap-1 px-1 mt-1', isOwn ? 'flex-row' : 'flex-row-reverse')}>
          <span className="text-[10px] text-text-tertiary">{timeAgo(message.createdAt)}</span>
          {isOwn && (
            message.read ? (
              <CheckCheck className="h-3.5 w-3.5 text-neon-cyan animate-read-check" />
            ) : (
              <Check className="h-3.5 w-3.5 text-text-tertiary" />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
