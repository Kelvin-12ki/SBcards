import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, Trash2, Contact, SmilePlus } from 'lucide-react';
import { cn, timeAgo } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import type { Message } from '@/types/messaging';

/** WEB: quick-pick emoji offered by the reaction button. */
const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏', '👏'];

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onDelete?: (messageId: string) => void;
  // WEB: reaction support
  currentUserId?: string;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  // WEB: lets message search scroll a specific bubble into view
  highlighted?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  senderName,
  isFirstInGroup = true,
  isLastInGroup = true,
  onDelete,
  currentUserId = '',
  onToggleReaction,
  highlighted = false,
}) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const messageType = message.type ?? 'text';
  const hasReactions =
    !!message.reactions && Object.keys(message.reactions).length > 0;

  // Corner rounding follows the position in a run of same-sender messages.
  const bubbleShape = isOwn
    ? cn(
        isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-br-md',
        isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-br-lg',
        !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tr-lg rounded-br-md',
        !isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-r-lg',
      )
    : cn(
        isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-bl-md',
        isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-bl-lg',
        !isFirstInGroup && isLastInGroup && 'rounded-2xl rounded-tl-lg rounded-bl-md',
        !isFirstInGroup && !isLastInGroup && 'rounded-2xl rounded-l-lg',
      );

  const textBubbleTheme = isOwn
    ? 'bg-gradient-to-r from-gold to-gold-strong text-gold-ink'
    : 'bg-surface-2 text-text-primary border border-border-subtle';

  /** WEB: the bubble body, which varies by message type. */
  const renderBody = () => {
    // WEB: image message
    if (messageType === 'image' && message.mediaUrl) {
      return (
        <div
          className={cn(
            'w-fit max-w-[80%] overflow-hidden',
            bubbleShape,
            isOwn
              ? 'bg-gradient-to-r from-gold/20 to-gold-strong/20 border border-gold/30'
              : 'bg-surface-2 border border-border-subtle',
          )}
        >
          <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={message.mediaUrl}
              alt={message.content || 'Shared image'}
              loading="lazy"
              className="max-w-[300px] w-full object-cover"
            />
          </a>
          {message.content && (
            <p
              className={cn(
                'px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                isOwn ? 'text-text-primary' : 'text-text-primary',
              )}
            >
              {message.content}
            </p>
          )}
        </div>
      );
    }

    // WEB: shared business card. Links to /card/:id — the public card view.
    // /cards/:id is not a route in this app (only /cards/new and
    // /cards/:id/edit exist), so that path would fall through to NotFound.
    if (messageType === 'card-share' && message.cardData) {
      const { cardId, name, role, company, avatarUrl } = message.cardData;
      const subtitle = [role, company].filter(Boolean).join(' at ');

      return (
        <Link
          to={`/card/${cardId}`}
          className={cn(
            'block w-fit max-w-[80%] transition-all duration-200 hover:scale-[1.02]',
            bubbleShape,
          )}
        >
          <div className="rounded-xl border border-border-subtle bg-surface-2 p-3 hover-glow-gold">
            <div className="flex items-center gap-3">
              <Avatar
                src={avatarUrl}
                alt={name}
                size="sm"
                className="border border-border-subtle ring-2 ring-gold/20 flex-shrink-0"
                fallbackInitials={name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-text-primary truncate">{name}</p>
                {subtitle && (
                  <p className="text-xs text-text-tertiary truncate">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gold">
              <Contact className="h-3.5 w-3.5" />
              View card
            </div>
          </div>
        </Link>
      );
    }

    // WEB: plain text (unchanged rendering)
    return (
      <div
        className={cn(
          'relative w-fit max-w-[80%] px-4 py-2.5 text-sm leading-relaxed',
          textBubbleTheme,
          bubbleShape,
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    );
  };

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        'flex flex-col animate-message-in group/msg relative',
        isOwn ? 'items-end' : 'items-start',
        isFirstInGroup ? 'mt-2' : 'mt-0.5',
        // WEB: transient highlight when jumped to from search
        highlighted && 'rounded-2xl ring-2 ring-gold/60 ring-offset-2 ring-offset-surface-1',
      )}
    >
      {/* Sender name for other users — only show for first in group */}
      {!isOwn && senderName && isFirstInGroup && (
        <span className="text-[11px] font-medium text-gold/70 px-1 mb-0.5">{senderName}</span>
      )}

      {renderBody()}

      {/* Delete button — only on own messages, appears on hover */}
      {isOwn && isLastInGroup && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(message.id);
          }}
          className="absolute -top-1 -left-7 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 flex items-center justify-center h-6 w-6 rounded-full bg-surface-3 border border-border-subtle text-text-tertiary hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10"
          aria-label="Delete message"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      {/* WEB: react button — mirrors the delete affordance on the other side */}
      {onToggleReaction && (
        <div
          className={cn(
            'absolute -top-1 opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100 transition-opacity duration-150',
            isOwn ? '-left-14' : '-right-7',
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen((open) => !open);
            }}
            className="flex items-center justify-center h-6 w-6 rounded-full bg-surface-3 border border-border-subtle text-text-tertiary hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-colors"
            aria-label="Add reaction"
          >
            <SmilePlus className="h-3 w-3" />
          </button>

          {pickerOpen && (
            <>
              {/* Click-away layer so the picker closes on an outside click */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPickerOpen(false)}
              />
              <div
                className={cn(
                  'absolute z-30 mt-1 flex gap-0.5 rounded-full border border-border-subtle bg-surface-3 px-1.5 py-1 shadow-lg',
                  isOwn ? 'right-0' : 'left-0',
                )}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReaction(message.id, emoji);
                      setPickerOpen(false);
                    }}
                    className="rounded-full px-1 text-sm leading-none transition-transform duration-150 hover:scale-125"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* WEB: reaction chips */}
      {hasReactions && (
        <div
          className={cn(
            'flex flex-wrap gap-1 mt-1 px-1',
            isOwn ? 'justify-end' : 'justify-start',
          )}
        >
          {Object.entries(message.reactions!).map(([emoji, userIds]) => {
            const reactors = userIds ?? [];
            if (reactors.length === 0) return null;
            const mine = reactors.includes(currentUserId);

            return (
              <button
                key={emoji}
                onClick={() => onToggleReaction?.(message.id, emoji)}
                disabled={!onToggleReaction}
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors',
                  mine
                    ? 'bg-gold/20 border-gold/30 text-gold'
                    : 'bg-surface-2 border-border-subtle text-text-tertiary hover:bg-surface-3',
                )}
                aria-label={`${reactors.length} reacted with ${emoji}`}
              >
                {emoji} <span>{reactors.length}</span>
              </button>
            );
          })}
        </div>
      )}

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
