import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import {
  Logger,
  NotFoundException,
  OnModuleDestroy,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { PresenceService, PresenceStatus } from './services/presence.service';
import { MessageType } from './entities/message.entity';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dto/send-message.dto';

/** A socket that has cleared the handshake and carries its owner's identity. */
interface AuthedSocket extends Socket {
  userId?: string;
  /** Timestamp of the most recent account-status lookup for this socket. */
  statusCheckedAt?: number;
}

interface SendMessagePayload {
  conversationId?: string;
  content?: string;
  type?: MessageType;
  mediaUrl?: string | null;
  cardData?: any;
  encrypted?: boolean;
}

interface ConversationPayload {
  conversationId?: string;
}

interface ReadPayload extends ConversationPayload {
  messageId?: string;
}

interface ReactionPayload extends ConversationPayload {
  messageId?: string;
  emoji?: string;
}

interface PresenceSubscribePayload {
  userIds?: string[];
}

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

const room = (conversationId: string) => `conv:${conversationId}`;

/** Cap on how many ids one presence:subscribe call may ask about. */
const MAX_PRESENCE_LOOKUP = 200;

/**
 * Per-user event ceilings for a 60 second window.
 *
 * The HTTP throttler already caps REST calls at 200/min per user, but
 * websocket handlers run entirely outside it, so these events previously had
 * no limit at all.
 */
const SOCKET_LIMITS: Record<string, number> = {
  'message:send': 30,
  'message:read': 60,
  'typing:start': 30,
  'typing:stop': 60,
  'reaction:add': 60,
  'reaction:remove': 60,
  'presence:subscribe': 30,
};

/** How long an account status may be trusted before it is read again. */
const STATUS_TTL_MS = 60_000;

/**
 * Result of validating a socket payload.
 *
 * Deliberately a flat shape rather than a `{ ok: true } | { ok: false }`
 * union: this backend compiles with `strictNullChecks: false`, under which
 * discriminant narrowing does not fire, so a union would need a cast to read
 * `.error` off the failure branch.
 */
interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessagingGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer()
  server!: Server;

  private unsubscribeOffline: (() => void) | null = null;

  /**
   * Per-user account status cache. Keyed by user id so every socket a banned
   * account opens shares one verdict instead of each doing its own lookup.
   */
  private readonly statusCache = new Map<
    string,
    { checkedAt: number; blocked: 'banned' | 'suspended' | null }
  >();

  /** Fixed-window counters for SOCKET_LIMITS, keyed by `event:userId`. */
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  /**
   * Validates socket payloads the way the HTTP ValidationPipe would.
   *
   * `whitelist` (rather than `forbidNonWhitelisted`) is deliberate: it strips
   * unknown keys, which is the actual vulnerability — `cardData` is stored as
   * a free-form object, so anything unrecognised would otherwise be persisted.
   * Rejecting outright would also break any client that happens to send an
   * extra field, which is a risk the REST path already covers for itself.
   */
  private readonly socketValidator = new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
    private readonly presenceService: PresenceService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(): void {
    // Announce offline only once the grace period has actually elapsed,
    // rather than the moment a socket drops.
    this.unsubscribeOffline = this.presenceService.onOffline(
      (userId, lastSeen) => {
        void this.broadcastPresence(userId, 'offline', lastSeen);
      },
    );
  }

  onModuleDestroy(): void {
    this.unsubscribeOffline?.();
    this.unsubscribeOffline = null;
  }

  // ────────────────────────────────────────────────────────────
  //  Connection lifecycle
  // ────────────────────────────────────────────────────────────

  async handleConnection(client: AuthedSocket): Promise<void> {
    const userId = this.authenticate(client);

    if (!userId) {
      // Nothing on this namespace is public, so an unverified socket is closed
      // rather than left connected in a half-usable state.
      client.emit('connect:error', { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    client.userId = userId;

    // Same rule the HTTP guards apply: a token issued before a ban must not
    // become a backdoor that outlives it.
    const blocked = await this.getBlockedStatus(userId);
    if (blocked) {
      client.emit('connect:error', {
        message:
          blocked === 'banned'
            ? 'Your account has been banned. Contact support if you believe this is a mistake.'
            : 'Your account is suspended. Contact support if you believe this is a mistake.',
      });
      client.disconnect(true);
      return;
    }

    try {
      const conversationIds =
        await this.messagingService.getConversationIdsForUser(userId);

      for (const id of conversationIds) {
        await client.join(room(id));
      }

      const cameOnline = this.presenceService.addSocket(userId, client.id);

      client.emit('connect:ready', { userId, conversations: conversationIds });

      if (cameOnline) {
        await this.broadcastPresence(userId, 'online');
      }

      this.logger.log(
        `Socket ${client.id} connected for user ${userId} (${conversationIds.length} rooms)`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to initialise socket ${client.id}: ${(err as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket): void {
    const userId = client.userId;
    if (!userId) return;

    // The offline broadcast is deferred to the presence grace period so a
    // reload or a wifi-to-cellular handover does not flap the indicator.
    this.presenceService.removeSocket(userId, client.id);
    this.logger.log(`Socket ${client.id} disconnected for user ${userId}`);
  }

  /** Verify the handshake token. Returns the user id, or null if invalid. */
  private authenticate(client: AuthedSocket): string | null {
    const raw =
      (client.handshake?.auth as any)?.token ??
      (client.handshake?.headers?.authorization as string | undefined);

    if (!raw || typeof raw !== 'string') return null;

    const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();

    try {
      const payload = this.jwtService.verify(token);
      return payload?.sub ? String(payload.sub) : null;
    } catch {
      return null;
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Enforcement shared by every handler
  // ────────────────────────────────────────────────────────────

  /**
   * Re-read `user.status` so a ban or suspension takes effect without waiting
   * for the JWT to expire.
   *
   * The handshake only proves the token was valid when it was issued — a
   * banned account could otherwise keep chatting for the remaining 7 days of
   * its lifetime, because nothing on this path ever consulted the database.
   *
   * Cached for STATUS_TTL_MS per user. A lookup error (not a missing user)
   * fails open and is not cached, so a transient database blip does not throw
   * every connected client off chat.
   */
  private async getBlockedStatus(
    userId: string,
  ): Promise<'banned' | 'suspended' | null> {
    const now = Date.now();
    const cached = this.statusCache.get(userId);
    if (cached && now - cached.checkedAt < STATUS_TTL_MS) {
      return cached.blocked;
    }

    let blocked: 'banned' | 'suspended' | null = null;
    try {
      const user = await this.usersService.findById(userId);
      const status = user?.status;
      blocked =
        status === 'banned' || status === 'suspended' ? status : null;
    } catch (err) {
      if (err instanceof NotFoundException) {
        // Account deleted — treat as inactive.
        blocked = 'banned';
      } else {
        return null;
      }
    }

    this.statusCache.set(userId, { checkedAt: now, blocked });
    return blocked;
  }

  /**
   * Guard used at the top of every handler. Returns an error string when the
   * call must be refused (and closes the socket for a non-active account),
   * or null when the handler may proceed.
   */
  private async authorize(client: AuthedSocket): Promise<string | null> {
    const userId = client.userId;
    if (!userId) return 'Unauthorized';

    const blocked = await this.getBlockedStatus(userId);
    if (!blocked) return null;

    const message =
      blocked === 'banned'
        ? 'Your account has been banned. Contact support if you believe this is a mistake.'
        : 'Your account is suspended. Contact support if you believe this is a mistake.';

    this.logger.warn(
      `Closing socket ${client.id} for ${blocked} account ${userId}`,
    );
    // Drop the socket rather than answering each event with an error: a
    // banned client should not be able to keep the connection warm.
    this.presenceService.removeSocket(userId, client.id);
    client.emit('connect:error', { message });
    client.disconnect(true);
    return message;
  }

  /** Fixed-window rate limit. Unknown events are not throttled. */
  private allow(userId: string, event: string): boolean {
    const limit = SOCKET_LIMITS[event];
    if (!limit) return true;

    const now = Date.now();

    // Bound the map: clients disconnect constantly, and expired windows are
    // never swept otherwise.
    if (this.buckets.size > 5000) {
      for (const [key, bucket] of this.buckets) {
        if (now >= bucket.resetAt) this.buckets.delete(key);
      }
    }

    const key = `${event}:${userId}`;
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  /**
   * Run a socket payload through the same DTO the REST endpoint uses.
   *
   * `conversationId` is stripped first: it travels in the handler argument
   * here, but the REST DTO has no such property (the id comes from the URL
   * there), so leaving it in would make the whitelist discard the field the
   * caller actually needs.
   */
  private async validatePayload<T>(
    payload: unknown,
    metatype: any,
    ...preserved: string[]
  ): Promise<ValidationResult<T>> {
    if (typeof payload !== 'object' || payload === null) {
      return { ok: false, error: 'Invalid payload' };
    }

    const source = payload as Record<string, unknown>;
    const extras: Record<string, unknown> = {};
    const rest: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (preserved.includes(key)) extras[key] = value;
      else rest[key] = value;
    }

    try {
      const value = (await this.socketValidator.transform(rest, {
        type: 'body',
        metatype,
        data: '',
      })) as T & Record<string, unknown>;
      return { ok: true, value: { ...extras, ...value } as T };
    } catch (err) {
      const messages = (err as any)?.response?.message;
      const error = Array.isArray(messages)
        ? messages.join(', ')
        : (err as Error)?.message || 'Invalid payload';
      return { ok: false, error };
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Messages
  // ────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<Ack<any>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };

    if (!this.allow(userId, 'message:send')) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const validated = await this.validatePayload<SendMessagePayload>(
      payload,
      SendMessageDto,
      'conversationId',
    );
    if (!validated.ok) {
      return { ok: false, error: validated.error ?? 'Invalid payload' };
    }

    const message = validated.value as SendMessagePayload;
    const conversationId = message.conversationId;
    if (!conversationId) {
      return { ok: false, error: 'conversationId is required' };
    }

    try {
      // sendMessage re-checks participation, blocks and the accepted-connection
      // rule, so the socket path enforces exactly what the REST path enforces.
      const created = await this.messagingService.sendMessage(
        conversationId,
        userId,
        message.content ?? '',
        {
          type: message.type,
          mediaUrl: message.mediaUrl ?? null,
          cardData: (message.cardData as any) ?? null,
          encrypted: message.encrypted ?? false,
        },
      );

      const body = created.toJSON();

      await this.ensureParticipantsJoined(conversationId);
      this.server.to(room(conversationId)).emit('message:new', body);

      return { ok: true, data: body };
    } catch (err) {
      return this.fail('message:send', err);
    }
  }

  @SubscribeMessage('message:read')
  async onMessageRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ReadPayload,
  ): Promise<Ack<any>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };
    if (!this.allow(userId, 'message:read')) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const conversationId = payload?.conversationId;
    if (!conversationId) {
      return { ok: false, error: 'conversationId is required' };
    }

    try {
      const modifiedCount = await this.messagingService.markAsRead(
        conversationId,
        userId,
      );
      const readAt = new Date();

      this.server.to(room(conversationId)).emit('message:read', {
        conversationId,
        messageId: payload.messageId ?? null,
        userId,
        readAt,
      });

      return { ok: true, data: { modifiedCount, readAt } };
    } catch (err) {
      return this.fail('message:read', err);
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Typing
  // ────────────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  async onTypingStart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ConversationPayload,
  ): Promise<Ack<null>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };
    if (!this.allow(userId, 'typing:start')) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const conversationId = payload?.conversationId;
    if (!conversationId) {
      return { ok: false, error: 'conversationId is required' };
    }

    try {
      // setTyping performs the participant check and refreshes the TTL the
      // existing REST typing endpoint also reads from.
      await this.messagingService.setTyping(conversationId, userId);

      client
        .to(room(conversationId))
        .emit('user:typing', { conversationId, userId });

      return { ok: true, data: null };
    } catch (err) {
      return this.fail('typing:start', err);
    }
  }

  @SubscribeMessage('typing:stop')
  async onTypingStop(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ConversationPayload,
  ): Promise<Ack<null>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };
    if (!this.allow(userId, 'typing:stop')) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const conversationId = payload?.conversationId;
    if (!conversationId) {
      return { ok: false, error: 'conversationId is required' };
    }

    try {
      await this.messagingService.assertParticipant(conversationId, userId);
      this.messagingService.clearTyping(conversationId, userId);

      client
        .to(room(conversationId))
        .emit('user:typing-stopped', { conversationId, userId });

      return { ok: true, data: null };
    } catch (err) {
      return this.fail('typing:stop', err);
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Reactions
  // ────────────────────────────────────────────────────────────

  @SubscribeMessage('reaction:add')
  async onReactionAdd(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ReactionPayload,
  ): Promise<Ack<any>> {
    return this.handleReaction(client, payload, 'add');
  }

  @SubscribeMessage('reaction:remove')
  async onReactionRemove(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: ReactionPayload,
  ): Promise<Ack<any>> {
    return this.handleReaction(client, payload, 'remove');
  }

  private async handleReaction(
    client: AuthedSocket,
    payload: ReactionPayload,
    mode: 'add' | 'remove',
  ): Promise<Ack<any>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };
    if (!this.allow(userId, `reaction:${mode}`)) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const { conversationId, messageId, emoji } = payload ?? {};
    if (!conversationId || !messageId || !emoji) {
      return {
        ok: false,
        error: 'conversationId, messageId and emoji are required',
      };
    }

    try {
      // Socket payloads never pass through the HTTP ValidationPipe, so the
      // emoji is validated inside the service rather than by a DTO.
      const message =
        mode === 'add'
          ? await this.messagingService.addReaction(
              conversationId,
              messageId,
              userId,
              emoji,
            )
          : await this.messagingService.removeReaction(
              conversationId,
              messageId,
              userId,
              emoji,
            );

      const reactions = message.reactions ?? {};

      await this.ensureParticipantsJoined(conversationId);
      this.server.to(room(conversationId)).emit('reaction:updated', {
        conversationId,
        messageId,
        reactions,
      });

      return { ok: true, data: { messageId, reactions } };
    } catch (err) {
      return this.fail(`reaction:${mode}`, err);
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Presence
  // ────────────────────────────────────────────────────────────

  @SubscribeMessage('presence:subscribe')
  async onPresenceSubscribe(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: PresenceSubscribePayload,
  ): Promise<Ack<any>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const denied = await this.authorize(client);
    if (denied) return { ok: false, error: denied };
    if (!this.allow(userId, 'presence:subscribe')) {
      return { ok: false, error: 'Rate limit exceeded' };
    }

    const requested = Array.isArray(payload?.userIds) ? payload.userIds : [];
    if (requested.length === 0) {
      return { ok: true, data: { statuses: [] } };
    }

    try {
      // Only report on people the caller shares a conversation with. Without
      // this, any authenticated user could probe whether an arbitrary account
      // is currently online. Unrelated ids come back as offline.
      const visible = new Set(
        await this.messagingService.getConversationPartnerIds(userId),
      );

      const statuses = requested.slice(0, MAX_PRESENCE_LOOKUP).map((id) => {
        const target = String(id);
        return visible.has(target)
          ? this.presenceService.getPresence(target)
          : { userId: target, status: 'offline' as PresenceStatus };
      });

      for (const status of statuses) {
        client.emit('presence:status', status);
      }

      return { ok: true, data: { statuses } };
    } catch (err) {
      return this.fail('presence:subscribe', err);
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Helpers
  // ────────────────────────────────────────────────────────────

  /**
   * Join every connected participant's sockets to the conversation room.
   *
   * Rooms are joined on connect, so a conversation created after a client
   * connected has no room membership yet and its first messages would not
   * reach the other side until that client reconnected.
   */
  private async ensureParticipantsJoined(conversationId: string): Promise<void> {
    const target = room(conversationId);

    let participantIds: string[] = [];
    try {
      participantIds =
        await this.messagingService.getParticipantIds(conversationId);
    } catch {
      return;
    }

    for (const participantId of participantIds) {
      for (const socketId of this.presenceService.getSockets(participantId)) {
        const socket = this.getSocketById(socketId);
        if (socket && !socket.rooms.has(target)) {
          await socket.join(target);
        }
      }
    }
  }

  /**
   * Look up a live socket by id.
   *
   * Because this gateway declares a namespace, Nest injects the Namespace
   * rather than the Server, and the connected-socket map sits at a different
   * depth on each (`namespace.sockets` vs `server.sockets.sockets`). Both are
   * handled so the lookup does not depend on which one is wired in.
   */
  private getSocketById(socketId: string): Socket | undefined {
    const container = this.server?.sockets as any;
    if (!container) return undefined;

    if (typeof container.get === 'function') {
      return container.get(socketId);
    }

    if (typeof container.sockets?.get === 'function') {
      return container.sockets.get(socketId);
    }

    return undefined;
  }

  /** Broadcast a presence change to the rooms this user participates in. */
  private async broadcastPresence(
    userId: string,
    status: PresenceStatus,
    lastSeen?: Date,
  ): Promise<void> {
    try {
      const conversationIds =
        await this.messagingService.getConversationIdsForUser(userId);

      const body = { userId, status, ...(lastSeen ? { lastSeen } : {}) };

      for (const id of conversationIds) {
        this.server.to(room(id)).emit('presence:status', body);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to broadcast presence for ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /** Turn a thrown error into an ack the client can act on. */
  private fail(event: string, err: unknown): { ok: false; error: string } {
    const message =
      (err as any)?.response?.message ??
      (err as Error)?.message ??
      'Unexpected error';

    this.logger.warn(`${event} failed: ${message}`);
    return { ok: false, error: String(message) };
  }
}
