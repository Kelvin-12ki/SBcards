import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Loader2,
  ArrowDown,
  Contact,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import CardShareModal from './CardShareModal';
import { searchMessages } from '@/api/messaging';
import type { Message, SharedCardData, PresenceStatus } from '@/types/messaging';

export interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string) => void;
  currentUserId: string;
  loading?: boolean;
  isOtherUserTyping?: boolean;
  onInputChange?: (value: string) => void;
  otherUser?: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
  onBack?: () => void;
  onDelete?: (messageId: string) => void;
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
  hasMoreOlder?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  conversationId?: string;
  // WEB: real-time additions
  onSendCard?: (cardData: SharedCardData) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  otherUserPresence?: PresenceStatus;
}

/** Format a date to a human-readable label for date separators */
function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Check if two dates are on the same day */
function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Group messages by consecutive sender (runs) */
interface MessageGroup {
  senderId: string;
  messages: Message[];
  dateLabel: string;
  groupDate: string; // ISO date key
}

function groupMessages(messages: Message[]): Array<MessageGroup | { type: 'date-separator'; label: string }> {
  const result: Array<MessageGroup | { type: 'date-separator'; label: string }> = [];
  let lastDate = '';
  let currentGroup: MessageGroup | null = null;

  for (const msg of messages) {
    const msgDate = formatDateLabel(msg.createdAt);

    // Date separator
    if (msgDate !== lastDate) {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push({ type: 'date-separator', label: msgDate });
      lastDate = msgDate;
    }

    // Same sender grouping
    if (!currentGroup || currentGroup.senderId !== msg.senderId || !isSameDay(currentGroup.groupDate, msg.createdAt)) {
      if (currentGroup) result.push(currentGroup);
      currentGroup = {
        senderId: msg.senderId,
        messages: [msg],
        dateLabel: msgDate,
        groupDate: msg.createdAt,
      };
    } else {
      currentGroup.messages.push(msg);
    }
  }

  if (currentGroup) result.push(currentGroup);
  return result;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSend,
  currentUserId,
  loading = false,
  isOtherUserTyping = false,
  onInputChange,
  otherUser,
  onBack,
  onDelete,
  onLoadOlder,
  loadingOlder = false,
  hasMoreOlder = false,
  scrollContainerRef,
  conversationId,
  onSendCard,
  onToggleReaction,
  otherUserPresence,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // WEB: card share state
  const [cardModalOpen, setCardModalOpen] = useState(false);

  // WEB: in-conversation search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const displayName = otherUser?.displayName
    || (otherUser ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') : '')
    || otherUser?.email
    || 'Chat';

  const initials = displayName !== 'Chat'
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Group messages by date and sender
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

  // Scroll to bottom on initial load (conversation switch)
  const hasScrolledInitialRef = useRef(false);
  useEffect(() => {
    if (!loading && messages.length > 0 && !hasScrolledInitialRef.current) {
      // Instant scroll to bottom on first load — no animation
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      hasScrolledInitialRef.current = true;
    }
  }, [loading, messages]);

  // Reset initial scroll flag when conversation changes
  useEffect(() => {
    hasScrolledInitialRef.current = false;
    setNewMessageCount(0);
    // WEB: search is per-conversation
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedId(null);
  }, [conversationId]);

  // Track new incoming messages and show pill when scrolled up
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessagesLenRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  // Detect when user scrolls near/far from bottom
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distanceFromBottom < 150;
      // If user scrolls back to bottom, clear the count
      if (isNearBottomRef.current) {
        setNewMessageCount(0);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  // When new messages arrive: auto-scroll if near bottom, otherwise show pill
  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      const addedCount = messages.length - prevMessagesLenRef.current;
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setNewMessageCount((c) => c + addedCount);
      }
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    textareaRef.current?.focus();
  }, [input, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    onInputChange?.(value);
  }, [onInputChange]);

  // ── WEB: message search ──────────────────────────────────────────────────

  useEffect(() => {
    if (!searchOpen || !conversationId) return;

    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    // Debounced so a query is not issued on every keystroke.
    const handle = setTimeout(async () => {
      try {
        const results = await searchMessages(conversationId, term);
        if (!cancelled) setSearchResults(results);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery, searchOpen, conversationId]);

  const handleJumpToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    if (!el) {
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header — glass-morphism */}
      <div className="glass flex items-center gap-3 px-4 py-3 border-b border-border-subtle z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Avatar
              src={otherUser?.avatarUrl}
              alt={displayName}
              size="md"
              className="border border-border-subtle ring-2 ring-gold/20"
              fallbackInitials={initials}
            />
            {/* WEB: online dot */}
            {otherUserPresence === 'online' && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-surface-1"
                aria-label="Online"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
            {otherUserPresence === 'online' ? (
              <p className="text-[11px] text-green-400 truncate">Online</p>
            ) : (
              otherUser?.email && otherUser.email !== displayName && (
                <p className="text-[11px] text-text-tertiary truncate">{otherUser.email}</p>
              )
            )}
          </div>
        </div>

        {/* WEB: search toggle */}
        <button
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          className={cn(
            'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors flex-shrink-0',
            searchOpen
              ? 'bg-gold/15 text-gold'
              : 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
          )}
          aria-label={searchOpen ? 'Close search' : 'Search messages'}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>
      </div>

      {/* WEB: search panel */}
      {searchOpen && (
        <div className="border-b border-border-subtle bg-surface-1 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border-subtle px-3 py-2.5 search-glow transition-all duration-200">
            <Search className="h-4 w-4 text-text-tertiary flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search this conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />}
          </div>

          {searchQuery.trim() && !searching && (
            <div className="mt-2 max-h-52 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="py-3 text-center text-xs text-text-tertiary">
                  No messages found.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleJumpToMessage(result.id)}
                      className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-left transition-colors hover:bg-surface-3"
                    >
                      <p className="text-xs text-text-primary line-clamp-2">
                        {result.content}
                      </p>
                      <p className="mt-0.5 text-[10px] text-text-tertiary">
                        {new Date(result.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-7 w-7 animate-spin text-neon-cyan" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-5 rounded-3xl gradient-magical p-6 text-white animate-glow-pulse">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h3 className="font-display text-xl font-bold text-gradient-gold">Start a conversation</h3>
            <p className="mt-2.5 text-sm text-text-secondary max-w-xs leading-relaxed">
              Say hello to {displayName !== 'Chat' ? displayName : 'your new connection'}!
            </p>
            {isOtherUserTyping && (
              <div className="mt-4">
                <TypingIndicator
                  name={displayName !== 'Chat' ? displayName : undefined}
                  avatarUrl={otherUser?.avatarUrl}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0 px-2 sm:px-0">
            {/* Load older messages button */}
            {hasMoreOlder && (
              <div className="flex justify-center py-3">
                <button
                  onClick={onLoadOlder}
                  disabled={loadingOlder}
                  className="text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors disabled:opacity-50"
                >
                  {loadingOlder ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load older messages'
                  )}
                </button>
              </div>
            )}
            {groupedMessages.map((item, idx) => {
              if ('type' in item && item.type === 'date-separator') {
                return (
                  <div key={`date-${idx}`} className="date-separator my-4">
                    <span className="text-[11px] font-medium text-text-tertiary whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const group = item as MessageGroup;
              return (
                <div key={`group-${idx}`} className="flex flex-col">
                  {group.messages.map((msg, msgIdx) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === currentUserId}
                      senderName={
                        msg.senderId !== currentUserId && displayName !== 'Chat'
                          ? displayName
                          : undefined
                      }
                      isFirstInGroup={msgIdx === 0}
                      isLastInGroup={msgIdx === group.messages.length - 1}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                      onToggleReaction={onToggleReaction}
                      highlighted={highlightedId === msg.id}
                    />
                  ))}
                </div>
              );
            })}
            {isOtherUserTyping && (
              <TypingIndicator
                name={displayName !== 'Chat' ? displayName : undefined}
                avatarUrl={otherUser?.avatarUrl}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>

        {/* New messages pill — shows when scrolled up and new messages arrive */}
        {newMessageCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold to-gold-strong px-3.5 py-2 text-xs font-bold text-gold-ink shadow-lg shadow-gold/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-gold/40 active:scale-95 animate-bounce"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newMessageCount === 1 ? 'New message' : `${newMessageCount} new messages`}
          </button>
        )}
      </div>

      {/* Input area — refined glass input */}
      <div className="glass border-t border-border-subtle px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-end gap-2 sm:gap-3">
          {/* WEB: card share */}
          {onSendCard && (
            <button
              onClick={() => setCardModalOpen(true)}
              disabled={loading}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 border border-border-subtle text-text-tertiary transition-all duration-200 hover:text-gold hover:border-gold/40 active:scale-95 disabled:opacity-50"
              aria-label="Share a card"
            >
              <Contact className="h-4.5 w-4.5" />
            </button>
          )}

          <div className="flex-1 flex items-end rounded-2xl bg-surface-2 border border-border-subtle px-4 py-2 focus-within:border-gold/50 focus-within:ring-1 focus-within:ring-gold/20 transition-all duration-200">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none leading-relaxed max-h-[120px]"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200',
              input.trim()
                ? 'bg-gradient-to-r from-gold to-gold-strong text-gold-ink shadow-lg shadow-gold/25 hover-glow-gold active:scale-95'
                : 'bg-surface-2 text-text-tertiary cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* WEB: card picker */}
      {onSendCard && (
        <CardShareModal
          isOpen={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          onSelect={onSendCard}
        />
      )}
    </div>
  );
};

export default ChatWindow;
