import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { cn } from '@/utils/helpers';
import { getConversations, getMessages, sendMessage, markAsRead, setTypingStatus, getTypingStatus } from '@/api/messaging';
import type { Conversation, Message } from '@/types/messaging';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import Spinner from '@/components/ui/Spinner';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id || '';

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      return;
    }
    let cancelled = false;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const data = await getMessages(activeConvId);
        if (!cancelled) setMessages(data);
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

  // Poll for new messages every 2 seconds for real-time feel
  useEffect(() => {
    if (!activeConvId) return;

    let cancelled = false;
    const pollMessages = async () => {
      try {
        const data = await getMessages(activeConvId);
        if (!cancelled) {
          setMessages(data);
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

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setShowMobileList(false);
    setSearchParams({ conversation: id }, { replace: true });
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);

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
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
      {/* Heading */}
      <div className="mb-5 flex items-center justify-between">
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

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1">
        {/* Left panel - Conversation List */}
        <div
          className={cn(
            'border-r border-border-subtle overflow-y-auto',
            // Mobile: hide when chat is open. Desktop: always show at fixed width
            showChatOnMobile ? 'hidden' : 'block',
            'w-full lg:w-[340px] lg:block',
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
        <div
          className={cn(
            'flex-1 min-w-0',
            // Mobile: only show if a conversation is selected
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
              onBack={conversations.length > 0 ? () => setShowMobileList(true) : undefined}
            />
          ) : (
            <div className="flex items-center justify-center flex-1">
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
