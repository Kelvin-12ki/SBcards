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
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { PresenceService, PresenceStatus } from './services/presence.service';
import { MessageType } from './entities/message.entity';

/** A socket that has cleared the handshake and carries its owner's identity. */
interface AuthedSocket extends Socket {
  userId?: string;
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
    private readonly presenceService: PresenceService,
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
  //  Messages
  // ────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async onMessageSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<Ack<any>> {
    const userId = client.userId;
    if (!userId) return { ok: false, error: 'Unauthorized' };

    const conversationId = payload?.conversationId;
    if (!conversationId) {
      return { ok: false, error: 'conversationId is required' };
    }

    try {
      // sendMessage re-checks participation and the accepted-connection rule,
      // so the socket path enforces exactly what the REST path enforces.
      const message = await this.messagingService.sendMessage(
        conversationId,
        userId,
        payload.content ?? '',
        {
          type: payload.type,
          mediaUrl: payload.mediaUrl ?? null,
          cardData: payload.cardData ?? null,
          encrypted: payload.encrypted ?? false,
        },
      );

      const body = message.toJSON();

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
