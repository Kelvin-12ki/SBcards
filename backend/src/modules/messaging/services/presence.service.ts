import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export type PresenceStatus = 'online' | 'offline';

export interface PresenceRecord {
  userId: string;
  status: PresenceStatus;
  lastSeen?: Date;
}

interface PresenceEntry {
  lastSeen: Date;
  sockets: Set<string>;
}

/**
 * In-memory presence tracking for the chat gateway.
 *
 * A user is online while they hold at least one live socket. When their last
 * socket drops we wait out a grace period before announcing them offline —
 * a page reload or a phone flipping between wifi and cellular tears down and
 * re-establishes the socket within a second or two, and without the grace
 * window every such blip would flap the indicator for everyone watching.
 *
 * State is per-process. With more than one API instance this must move to
 * Redis (or a socket.io adapter) or each instance will only see its own half
 * of the users.
 */
@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);

  private readonly presence = new Map<string, PresenceEntry>();
  private readonly graceTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly offlineListeners = new Set<
    (userId: string, lastSeen: Date) => void
  >();

  static readonly GRACE_PERIOD_MS = 30_000;

  /**
   * Register a socket for a user.
   * @returns true when this transitions the user from offline to online.
   */
  addSocket(userId: string, socketId: string): boolean {
    this.cancelGrace(userId);

    let entry = this.presence.get(userId);
    const wasOnline = !!entry && entry.sockets.size > 0;

    if (!entry) {
      entry = { lastSeen: new Date(), sockets: new Set() };
      this.presence.set(userId, entry);
    }

    entry.sockets.add(socketId);
    entry.lastSeen = new Date();

    return !wasOnline;
  }

  /**
   * Drop a socket. If it was the user's last one, start the grace period;
   * registered listeners fire only if no new socket arrives before it expires.
   */
  removeSocket(userId: string, socketId: string): void {
    const entry = this.presence.get(userId);
    if (!entry) return;

    entry.sockets.delete(socketId);
    entry.lastSeen = new Date();

    if (entry.sockets.size > 0) return;

    this.cancelGrace(userId);

    const timer = setTimeout(() => {
      this.graceTimers.delete(userId);

      const current = this.presence.get(userId);
      // Reconnected during the window — nothing to announce.
      if (!current || current.sockets.size > 0) return;

      const lastSeen = current.lastSeen;
      for (const listener of this.offlineListeners) {
        try {
          listener(userId, lastSeen);
        } catch (err) {
          this.logger.warn(
            `Presence offline listener failed for ${userId}: ${(err as Error).message}`,
          );
        }
      }
    }, PresenceService.GRACE_PERIOD_MS);

    // Do not hold the event loop open purely for a presence timer.
    timer.unref?.();
    this.graceTimers.set(userId, timer);
  }

  /** A user in the grace window still counts as online. */
  isOnline(userId: string): boolean {
    const entry = this.presence.get(userId);
    if (!entry) return false;
    return entry.sockets.size > 0 || this.graceTimers.has(userId);
  }

  getPresence(userId: string): PresenceRecord {
    const entry = this.presence.get(userId);
    if (!entry) {
      return { userId, status: 'offline' };
    }

    return this.isOnline(userId)
      ? { userId, status: 'online', lastSeen: entry.lastSeen }
      : { userId, status: 'offline', lastSeen: entry.lastSeen };
  }

  getBulkPresence(userIds: string[]): PresenceRecord[] {
    return userIds.map((id) => this.getPresence(id));
  }

  /** Socket ids currently held by a user, across devices/tabs. */
  getSockets(userId: string): string[] {
    return Array.from(this.presence.get(userId)?.sockets ?? []);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.presence.keys()).filter((id) => this.isOnline(id));
  }

  /** Subscribe to grace-period expiry so the gateway can broadcast offline. */
  onOffline(listener: (userId: string, lastSeen: Date) => void): () => void {
    this.offlineListeners.add(listener);
    return () => this.offlineListeners.delete(listener);
  }

  private cancelGrace(userId: string): void {
    const timer = this.graceTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(userId);
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.graceTimers.values()) {
      clearTimeout(timer);
    }
    this.graceTimers.clear();
    this.presence.clear();
    this.offlineListeners.clear();
  }
}
