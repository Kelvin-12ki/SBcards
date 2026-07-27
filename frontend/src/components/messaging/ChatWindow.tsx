import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Avatar from '@/components/ui/Avatar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import type { Message } from '@/types/messaging';

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
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName = otherUser?.displayName
    || (otherUser ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(' ') : '')
    || otherUser?.email
    || 'Chat';

  const initials = displayName !== 'Chat'
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar
            src={otherUser?.avatarUrl}
            alt={displayName}
            size="md"
            className="border border-border-subtle"
            fallbackInitials={initials}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 rounded-2xl gradient-magical p-4 text-white animate-glow-pulse">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-gradient-magical">No messages yet</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-xs">
              Send a message to start the conversation!
            </p>
            {isOtherUserTyping && (
              <div className="mt-4">
                <TypingIndicator name={displayName !== 'Chat' ? displayName : undefined} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                senderName={
                  msg.senderId !== currentUserId && displayName !== 'Chat'
                    ? displayName
                    : undefined
                }
              />
            ))}
            {isOtherUserTyping && <TypingIndicator name={displayName !== 'Chat' ? displayName : undefined} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border-subtle p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onInputChange?.(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              'flex-1 rounded-2xl border border-border-subtle bg-surface-2 px-4 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
              'transition-all duration-200',
            )}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-200',
              input.trim()
                ? 'bg-gradient-to-r from-gold to-gold-strong text-gold-ink shadow-lg shadow-gold/20 hover-glow-gold'
                : 'bg-surface-2 text-text-tertiary cursor-not-allowed',
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
