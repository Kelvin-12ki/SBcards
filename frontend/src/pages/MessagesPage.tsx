import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, Bell, BellOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cn } from '@/utils/helpers';
import { getConversations, getMessages, getNewMessages, sendMessage, markAsRead, setTypingStatus, getTypingStatus, deleteMessage } from '@/api/messaging';
import type { Conversation, Message } from '@/types/messaging';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import Spinner from '@/components/ui/Spinner';
import { registerPushToken, getNotificationStatus } from '@/utils/push';
import toast from 'react-hot-toast';

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

  // Cursor-based polling: track the last message ID for efficient incremental fetches
  const lastMessageIdRef = useRef<string | null>(null);

  // "Load Older" pagination state
  const [olderPage, setOlderPage] = useState(2); // next page to fetch (page 1 already loaded)
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Fetch conversations
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

  // Poll conversations list every 5 seconds for new messages in sidebar
  useEffect(() => {
    let cancelled = false;
    const pollConversations = async () => {
      try {
        const data = await getConversations();
        if (!cancelled) {
          setConversations(data);
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(pollConversations, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeConvId]);

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
          // Set cursor to the last message's ID for polling
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

  // Poll for new messages every 2 seconds using cursor-based fetching
  // Only fetches messages after the last known message, then appends them
  useEffect(() => {
    if (!activeConvId) return;

    let cancelled = false;
    const pollMessages = async () => {
      const cursorId = lastMessageIdRef.current;
      if (!cursorId) return; // No messages loaded yet, skip poll

      try {
        const newMsgs = await getNewMessages(activeConvId, cursorId);
        if (!cancelled && newMsgs.length > 0) {
          setMessages((prev) => {
            // Deduplicate: only add messages not already in state
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMsgs.filter((m) => !existingIds.has(m.id));
            if (unique.length === 0) return prev;
            return [...prev, ...unique];
          });
          // Update cursor to the latest message
          lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
          // Mark as read
          markAsRead(activeConvId).catch(() => {});
          // Update unread count
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId ? { ...c, unreadCount: 0 } : c,
            ),
          );
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(pollMessages, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeConvId]);

  // Poll typing status for the active conversation
  useEffect(() => {
    if (!activeConvId) {
      setIsOtherTyping(false);
      return;
    }

    let cancelled = false;
    const pollTyping = async () => {
      try {
        const { typing } = await getTypingStatus(activeConvId);
        if (!cancelled) setIsOtherTyping(typing);
      } catch {
        // Ignore polling errors
      }
    };

    // Initial fetch
    pollTyping();

    const interval = setInterval(pollTyping, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
      setIsOtherTyping(false);
    };
  }, [activeConvId]);

  // Track previous conversation for cleanup
  const prevConvIdRef = useRef<string | undefined>(undefined);

  // Clear typing for the old conversation when switching
  useEffect(() => {
    if (prevConvIdRef.current && prevConvIdRef.current !== activeConvId) {
      setTypingStatus(prevConvIdRef.current, false).catch(() => {});
    }
    prevConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!activeConvId) return;

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (value.length > 0) {
        const now = Date.now();
        // Send typing status if more than 2s since last ping
        if (now - lastTypingSentRef.current > 2000) {
          setTypingStatus(activeConvId, true).catch(() => {});
          lastTypingSentRef.current = now;
        }
        // Auto-clear typing after 3s of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTypingStatus(activeConvId, false).catch(() => {});
        }, 3000);
      } else {
        // Input is empty, clear typing
        setTypingStatus(activeConvId, false).catch(() => {});
      }
    },
    [activeConvId],
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
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const newMsg = await sendMessage(activeConvId, content);
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? newMsg : m)),
        );
        // Update conversation list with latest message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
              : c,
          ),
        );
        // Clear typing status after sending
        setTypingStatus(activeConvId, false).catch(() => {});
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error('Failed to send message:', err);
      }
    },
    [activeConvId, currentUserId],
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

export default MessagesPage;
