import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MessageSquare, Bell, BellOff, WifiOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cn } from '@/utils/helpers';
import {
  getConversations,
  getMessages,
  getNewMessages,
  sendMessage,
  markAsRead,
  setTypingStatus,
  deleteMessage,
} from '@/api/messaging';
import type {
  Conversation,
  Message,
  SharedCardData,
  MessageReactions,
} from '@/types/messaging';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import Spinner from '@/components/ui/Spinner';
import { registerPushToken, getNotificationStatus } from '@/utils/push';
import { getSocket, emitWithAck } from '@/services/socket';
import { usePresenceMap } from '@/hooks/usePresence';
import toast from 'react-hot-toast';

/** WEB: how long the composer waits after the last keystroke before saying "stopped typing". */
const TYPING_IDLE_MS = 2000;

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const currentUserId = user?.id || '';

  // WEB: live connection state, surfaced as a banner when the socket drops
  const [socketConnected, setSocketConnected] = useState(false);

  // Cursor for re-syncing after a reconnect (replaces the old polling cursor)
  const lastMessageIdRef = useRef<string | null>(null);

  // "Load Older" pagination state
  const [olderPage, setOlderPage] = useState(2); // next page to fetch (page 1 already loaded)
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // WEB: socket handlers are registered once, so they read the current
  // conversation through refs rather than forcing a re-subscribe on every
  // conversation switch.
  const activeConvIdRef = useRef<string | undefined>(undefined);
  const currentUserIdRef = useRef<string>('');
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Fetch conversations (initial REST load — sockets only carry updates)
  useEffect(() => {
    let cancelled = false;
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        if (!cancelled) {
          setConversations(data);
          // Auto-select conversation from URL query param
          const convParam = searchParams.get('conversation');
          if (convParam) {
            setActiveConvId(convParam);
            setShowMobileList(false);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        if (!cancelled) setConversationsLoading(false);
      }
    };
    fetchConversations();
    return () => { cancelled = true; };
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // A failed refresh is not worth interrupting the user for.
    }
  }, []);

  // Fetch messages when active conversation changes (initial load)
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      lastMessageIdRef.current = null;
      setOlderPage(2);
      setHasMoreOlder(true);
      return;
    }
    let cancelled = false;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const data = await getMessages(activeConvId);
        if (!cancelled) {
          setMessages(data);
          lastMessageIdRef.current = data.length > 0 ? data[data.length - 1].id : null;
          // Reset pagination for "Load Older"
          setOlderPage(2);
          setHasMoreOlder(data.length >= 50);
        }
        // Mark as read
        await markAsRead(activeConvId);
        // Update unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, unreadCount: 0 } : c,
          ),
        );
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };
    fetchMessages();
    return () => { cancelled = true; };
  }, [activeConvId]);

  // ── WEB: real-time socket wiring (replaces message/typing/conversation polling) ──
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => {
      setSocketConnected(false);
      setIsOtherTyping(false);
    };

    /**
     * Pull in anything that landed while the socket was down. Without this a
     * dropped connection silently loses every message sent during the gap,
     * since nothing polls for them any more.
     */
    const handleReady = async () => {
      setSocketConnected(true);
      const convId = activeConvIdRef.current;
      const cursor = lastMessageIdRef.current;
      if (!convId || !cursor) return;

      try {
        const missed = await getNewMessages(convId, cursor);
        if (missed.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const unique = missed.filter((m) => !seen.has(m.id));
            if (unique.length === 0) return prev;
            return [...prev, ...unique];
          });
          lastMessageIdRef.current = missed[missed.length - 1].id;
        }
      } catch {
        // Best-effort catch-up.
      }
      refreshConversations();
    };

    const handleNewMessage = (message: Message) => {
      if (!message?.id) return;
      const convId = activeConvIdRef.current;
      const meId = currentUserIdRef.current;

      if (message.conversationId === convId) {
        setMessages((prev) => {
          // The room echo also reaches the sender, and an optimistic copy may
          // already be present, so both are reconciled by id here.
          if (prev.some((m) => m.id === message.id)) return prev;

          const pendingIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.senderId === message.senderId &&
              m.content === message.content,
          );
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = message;
            return next;
          }

          return [...prev, message];
        });

        lastMessageIdRef.current = message.id;

        // Someone else's message in the open conversation is read on arrival.
        if (message.senderId !== meId) {
          emitWithAck('message:read', { conversationId: message.conversationId }).catch(
            () => markAsRead(message.conversationId).catch(() => {}),
          );
        }
      }

      // Keep the sidebar preview current without refetching the whole list.
      setConversations((prev) => {
        const known = prev.some((c) => c.id === message.conversationId);
        if (!known) {
          // First message of a conversation this client has never seen.
          refreshConversations();
          return prev;
        }

        return prev.map((c) => {
          if (c.id !== message.conversationId) return c;
          const isActive = c.id === convId;
          const fromOther = message.senderId !== meId;
          return {
            ...c,
            lastMessageAt: message.createdAt,
            lastMessagePreview: previewFor(message),
            unreadCount:
              fromOther && !isActive ? (c.unreadCount ?? 0) + 1 : isActive ? 0 : c.unreadCount,
          };
        });
      });
    };

    const handleRead = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      messageId: string | null;
      userId: string;
      readAt: string;
    }) => {
      if (conversationId !== activeConvIdRef.current) return;
      if (userId === currentUserIdRef.current) return;

      // The other side read the thread, so every message we sent is now read.
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserIdRef.current && !m.read ? { ...m, read: true } : m,
        ),
      );
    };

    const handleTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === activeConvIdRef.current && userId !== currentUserIdRef.current) {
        setIsOtherTyping(true);
      }
    };

    const handleTypingStopped = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === activeConvIdRef.current) {
        setIsOtherTyping(false);
      }
    };

    const handleReactionUpdated = ({
      messageId,
      reactions,
    }: {
      conversationId: string;
      messageId: string;
      reactions: MessageReactions;
    }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      );
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect:ready', handleReady);
    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleRead);
    socket.on('user:typing', handleTyping);
    socket.on('user:typing-stopped', handleTypingStopped);
    socket.on('reaction:updated', handleReactionUpdated);

    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect:ready', handleReady);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleRead);
      socket.off('user:typing', handleTyping);
      socket.off('user:typing-stopped', handleTypingStopped);
      socket.off('reaction:updated', handleReactionUpdated);
    };
  }, [currentUserId, refreshConversations]);

  // WEB: presence for everyone in the sidebar
  const partnerIds = useMemo(
    () =>
      conversations
        .map((c) => c.otherUser?.id)
        .filter((id): id is string => !!id),
    [conversations],
  );
  const presenceMap = usePresenceMap(partnerIds);

  // Track previous conversation for cleanup
  const prevConvIdRef = useRef<string | undefined>(undefined);

  // Clear typing for the old conversation when switching
  useEffect(() => {
    const previous = prevConvIdRef.current;
    if (previous && previous !== activeConvId) {
      emitWithAck('typing:stop', { conversationId: previous }).catch(() => {
        setTypingStatus(previous, false).catch(() => {});
      });
    }
    prevConvIdRef.current = activeConvId;
    setIsOtherTyping(false);
  }, [activeConvId]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!activeConvId) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const stopTyping = () => {
        emitWithAck('typing:stop', { conversationId: activeConvId }).catch(() => {});
      };

      if (value.length > 0) {
        const now = Date.now();
        // Re-ping at most every 2s; the server keeps its own TTL.
        if (now - lastTypingSentRef.current > TYPING_IDLE_MS) {
          emitWithAck('typing:start', { conversationId: activeConvId }).catch(() => {});
          lastTypingSentRef.current = now;
        }
        typingTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
      } else {
        lastTypingSentRef.current = 0;
        stopTyping();
      }
    },
    [activeConvId],
  );

  /**
   * Push a message through the socket, falling back to REST when the socket
   * is unavailable so a dropped connection degrades rather than blocks.
   */
  const dispatchMessage = useCallback(
    async (
      conversationId: string,
      payload: {
        content: string;
        type?: 'text' | 'image' | 'card-share';
        mediaUrl?: string;
        cardData?: SharedCardData;
      },
    ): Promise<Message> => {
      try {
        return await emitWithAck<Message>('message:send', {
          conversationId,
          ...payload,
        });
      } catch (socketErr) {
        if (payload.type && payload.type !== 'text') {
          // The REST fallback below only carries text, so a non-text message
          // has to surface the failure rather than silently lose its payload.
          throw socketErr;
        }
        return sendMessage(conversationId, payload.content);
      }
    },
    [],
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeConvId) return;
      // Optimistic: add message immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        conversationId: activeConvId,
        senderId: currentUserId,
        content,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'text',
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const newMsg = await dispatchMessage(activeConvId, { content, type: 'text' });
        // Replace temp message with real one (the room echo may have already
        // done this, in which case just drop the placeholder).
        setMessages((prev) => {
          const alreadyPresent = prev.some((m) => m.id === newMsg.id);
          if (alreadyPresent) return prev.filter((m) => m.id !== tempId);
          return prev.map((m) => (m.id === tempId ? newMsg : m));
        });
        lastMessageIdRef.current = newMsg.id;

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  lastMessagePreview: content,
                  lastMessageAt: new Date().toISOString(),
                }
              : c,
          ),
        );

        emitWithAck('typing:stop', { conversationId: activeConvId }).catch(() => {});
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error('Failed to send message:', err);
        toast.error('Message failed to send.');
      }
    },
    [activeConvId, currentUserId, dispatchMessage],
  );

  const handleSendCard = useCallback(
    async (cardData: SharedCardData) => {
      if (!activeConvId) return;
      try {
        const newMsg = await dispatchMessage(activeConvId, {
          content: '',
          type: 'card-share',
          cardData,
        });
        setMessages((prev) =>
          prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
        );
        lastMessageIdRef.current = newMsg.id;
      } catch {
        toast.error('Could not share that card.');
      }
    },
    [activeConvId, dispatchMessage],
  );

  // WEB: one control toggles the reaction based on whether it is already mine
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeConvId) return;

      const target = messages.find((m) => m.id === messageId);
      const mine = !!target?.reactions?.[emoji]?.includes(currentUserId);
      const event = mine ? 'reaction:remove' : 'reaction:add';

      // Optimistic update; the broadcast that follows is authoritative.
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions: MessageReactions = { ...(m.reactions ?? {}) };
          const existing = reactions[emoji] ?? [];
          if (mine) {
            const next = existing.filter((id) => id !== currentUserId);
            if (next.length === 0) delete reactions[emoji];
            else reactions[emoji] = next;
          } else {
            reactions[emoji] = [...existing, currentUserId];
          }
          return { ...m, reactions };
        }),
      );

      try {
        await emitWithAck(event, { conversationId: activeConvId, messageId, emoji });
      } catch {
        // Roll back by restoring the message we captured before the change.
        if (target) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, reactions: target.reactions } : m)),
          );
        }
        toast.error('Could not update that reaction.');
      }
    },
    [activeConvId, messages, currentUserId],
  );

  const handleBack = useCallback(() => {
    setShowMobileList(true);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeConvId) return;
      // Optimistic: remove message immediately
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      try {
        await deleteMessage(activeConvId, messageId);
      } catch (err) {
        console.error('Failed to delete message:', err);
        // Re-fetch messages on failure to restore state
        const data = await getMessages(activeConvId);
        setMessages(data);
        lastMessageIdRef.current = data.length > 0 ? data[data.length - 1].id : null;
      }
    },
    [activeConvId],
  );

  const handleLoadOlder = useCallback(async () => {
    if (!activeConvId || loadingOlder) return;
    setLoadingOlder(true);
    try {
      // Save scroll height so we can restore position after prepending
      if (chatContainerRef.current) {
        prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
      }
      const data = await getMessages(activeConvId, olderPage, 50);
      if (data.length === 0) {
        setHasMoreOlder(false);
      } else {
        setMessages((prev) => [...data, ...prev]);
        setOlderPage((p) => p + 1);
        if (data.length < 50) setHasMoreOlder(false);
        // Restore scroll position after DOM update
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop =
              newScrollHeight - prevScrollHeightRef.current;
          }
        });
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  }, [activeConvId, olderPage, loadingOlder]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvId(id);
    setShowMobileList(false);
    setSearchParams({ conversation: id }, { replace: true });
  }, [setSearchParams]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const activePartnerId = activeConversation?.otherUser?.id;

  // Notification permission state
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(() => getNotificationStatus());
  const [notifRegistering, setNotifRegistering] = useState(false);

  const handleEnableNotifications = useCallback(async () => {
    setNotifRegistering(true);
    try {
      const result = await registerPushToken();
      setNotifStatus(getNotificationStatus());
      if (result) {
        toast.success('Notifications enabled!');
      } else if (getNotificationStatus() === 'denied') {
        toast.error('Notifications blocked. Enable them in browser settings (click the lock icon in the address bar).');
      } else {
        toast.error('Could not enable notifications. Try again.');
      }
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setNotifRegistering(false);
    }
  }, []);

  // Mobile: show list or chat
  const showChatOnMobile = !showMobileList && activeConvId;

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] -mx-4 -my-4 md:-mx-6 md:-my-6 lg:-mx-8 lg:-my-8">
      {/* Heading */}
      <div className="mb-5 flex items-center justify-between px-4 md:px-6 lg:px-8">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-gradient-gold">
          Messages
        </h1>
        {showChatOnMobile && (
          <button
            onClick={() => setShowMobileList(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors lg:hidden"
          >
            <MessageSquare className="h-4 w-4" />
            All Conversations
          </button>
        )}
      </div>

      {/* WEB: live-connection banner */}
      {!socketConnected && (
        <div className="mx-4 md:mx-6 lg:mx-8 mb-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm border bg-amber-500/10 border-amber-500/20 text-amber-400">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">
              Reconnecting to live chat. Messages will still send, but may take a moment to appear.
            </span>
          </div>
        </div>
      )}

      {/* Notification permission banner */}
      {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
        <div className="mx-4 md:mx-6 lg:mx-8 mb-4">
          <div className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm border',
            notifStatus === 'denied'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-gold/10 border-gold/20 text-gold',
          )}>
            {notifStatus === 'denied' ? <BellOff className="h-4 w-4 flex-shrink-0" /> : <Bell className="h-4 w-4 flex-shrink-0" />}
            <span className="flex-1">
              {notifStatus === 'denied'
                ? 'Notifications are blocked. Click the lock icon in your address bar → Notifications → Allow, then refresh.'
                : 'Enable notifications to get alerted when someone messages you.'}
            </span>
            {notifStatus === 'default' && (
              <button
                onClick={handleEnableNotifications}
                disabled={notifRegistering}
                className="flex-shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-gold-ink hover:bg-gold-strong transition-colors disabled:opacity-50"
              >
                {notifRegistering ? 'Enabling...' : 'Enable'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1">
        {/* Left panel - Conversation List */}
        {/* Desktop: always visible at 340px. Mobile: show/hide based on showMobileList */}
        <div
          className={cn(
            'w-full lg:w-[340px] lg:block border-r border-border-subtle overflow-y-auto flex-shrink-0',
            showChatOnMobile ? 'hidden' : 'block',
          )}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={handleSelectConversation}
            currentUserId={currentUserId}
            presenceMap={presenceMap}
          />
        </div>

        {/* Right panel - Chat Window */}
        {/* Desktop: always visible. Mobile: only visible when chat is open */}
        <div
          className={cn(
            'flex-1 min-w-0',
            showChatOnMobile ? 'flex' : 'hidden lg:flex',
          )}
        >
          {activeConvId ? (
            <ChatWindow
              messages={messages}
              onSend={handleSend}
              currentUserId={currentUserId}
              loading={messagesLoading}
              isOtherUserTyping={isOtherTyping}
              onInputChange={handleInputChange}
              otherUser={activeConversation?.otherUser}
              onBack={handleBack}
              onDelete={handleDeleteMessage}
              onLoadOlder={handleLoadOlder}
              loadingOlder={loadingOlder}
              hasMoreOlder={hasMoreOlder}
              scrollContainerRef={chatContainerRef}
              conversationId={activeConvId}
              onSendCard={handleSendCard}
              onToggleReaction={handleToggleReaction}
              otherUserPresence={
                activePartnerId ? presenceMap[activePartnerId] : undefined
              }
            />
          ) : (
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 rounded-3xl gradient-magical p-6 text-white animate-glow-pulse">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="font-display text-xl font-bold text-gradient-gold">Your Messages</h3>
                <p className="mt-2.5 text-sm text-text-secondary max-w-xs leading-relaxed">
                  Select a conversation to start networking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** WEB: sidebar preview text, mirroring how the server summarises each type. */
function previewFor(message: Message): string {
  if (message.type === 'image') {
    return message.content ? `📷 ${message.content}` : '📷 Photo';
  }
  if (message.type === 'card-share') {
    return message.content ? `📇 ${message.content}` : '📇 Shared a card';
  }
  return message.content;
}

export default MessagesPage;
