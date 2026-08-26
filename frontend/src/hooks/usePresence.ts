import { useEffect, useState } from 'react';
import { getSocket } from '@/services/socket';
import type { PresenceStatus, PresenceMap } from '@/types/messaging';

/**
 * WEB: track the online status of a single user.
 *
 * Subscribes on mount and then listens for pushed updates, so the status stays
 * current without polling.
 */
export function usePresence(userId?: string): PresenceStatus {
  const [status, setStatus] = useState<PresenceStatus>('offline');

  useEffect(() => {
    if (!userId) {
      setStatus('offline');
      return;
    }

    const socket = getSocket();

    const handleStatus = (payload: {
      userId: string;
      status: PresenceStatus;
    }) => {
      if (payload?.userId === userId) {
        setStatus(payload.status === 'online' ? 'online' : 'offline');
      }
    };

    socket.on('presence:status', handleStatus);

    // Ask for the current value straight away; the listener above keeps it
    // up to date from then on.
    const subscribe = () => socket.emit('presence:subscribe', { userIds: [userId] });
    subscribe();

    // A reconnect resets server-side room membership, so re-subscribe.
    socket.on('connect:ready', subscribe);

    return () => {
      socket.off('presence:status', handleStatus);
      socket.off('connect:ready', subscribe);
    };
  }, [userId]);

  return status;
}

/**
 * WEB: track online status for many users at once.
 *
 * Used by the conversation list, which needs a dot per row and would otherwise
 * open one subscription per conversation.
 */
export function usePresenceMap(userIds: string[]): PresenceMap {
  const [presence, setPresence] = useState<PresenceMap>({});

  // Sorted + joined so the effect re-runs on membership changes rather than on
  // every render that rebuilds the array.
  const key = userIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) {
      setPresence({});
      return;
    }

    const socket = getSocket();

    const handleStatus = (payload: {
      userId: string;
      status: PresenceStatus;
    }) => {
      if (!payload?.userId) return;
      setPresence((prev) => {
        const next = payload.status === 'online' ? 'online' : 'offline';
        if (prev[payload.userId] === next) return prev;
        return { ...prev, [payload.userId]: next };
      });
    };

    socket.on('presence:status', handleStatus);

    const subscribe = () => socket.emit('presence:subscribe', { userIds: ids });
    subscribe();
    socket.on('connect:ready', subscribe);

    return () => {
      socket.off('presence:status', handleStatus);
      socket.off('connect:ready', subscribe);
    };
  }, [key]);

  return presence;
}

export default usePresence;
