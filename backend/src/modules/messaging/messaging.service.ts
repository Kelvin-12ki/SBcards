import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './entities/conversation.entity';
import {
  Message,
  MessageDocument,
  MessageType,
  SharedCardData,
} from './entities/message.entity';
import { UsersService } from '../users/users.service';
import { ConnectionsService } from '../connections/connections.service';
import { PushService } from '../notifications/push.service';

/** Optional payload accompanying a non-text message. */
export interface SendMessageOptions {
  type?: MessageType;
  mediaUrl?: string | null;
  cardData?: SharedCardData | null;
  encrypted?: boolean;
}

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private readonly typingStatus = new Map<string, Map<string, number>>();
  private readonly TYPING_TTL = 5000;
  private typingCleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly usersService: UsersService,
    private readonly connectionsService: ConnectionsService,
    private readonly pushService: PushService,
  ) {}

  onModuleInit() {
    this.typingCleanupInterval = setInterval(() => {
      this.cleanupTypingStatus();
    }, 10000);
  }

  onModuleDestroy() {
    if (this.typingCleanupInterval) {
      clearInterval(this.typingCleanupInterval);
      this.typingCleanupInterval = null;
    }
  }

  private cleanupTypingStatus() {
    const now = Date.now();
    for (const [convId, users] of this.typingStatus.entries()) {
      for (const [userId, timestamp] of users.entries()) {
        if (now - timestamp > this.TYPING_TTL) {
          users.delete(userId);
        }
      }
      if (users.size === 0) {
        this.typingStatus.delete(convId);
      }
    }
  }

  /**
   * Build an enriched otherUser object from a raw User document.
   * Falls back to email-based name when displayName is missing.
   */
  private buildOtherUser(user: any) {
    const name = user.displayName || user.email?.split('@')[0] || 'User';
    const parts = name.split(' ');
    return {
      id: user._id?.toString() ?? '',
      firstName: parts[0] || 'User',
      lastName: parts.slice(1).join(' ') || '',
      displayName: name,
      avatarUrl: user.avatarUrl || null,
      company: user.company || null,
      email: user.email || null,
    };
  }

  /**
   * Find or create a conversation between two users.
   * Uses sorted participantIds to enforce the unique constraint.
   * Returns the conversation enriched with the other user's profile.
   */
  async findOrCreate(userId: string, participantId: string) {
    if (userId === participantId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const { allowed, status } =
      await this.connectionsService.hasAcceptedConnection(
        userId,
        participantId,
      );
    if (!allowed) {
      if (status === 'pending') {
        throw new ForbiddenException(
          'Connection request is pending. Please wait for the other user to accept before messaging.',
        );
      }
      throw new ForbiddenException(
        'You can only message users with whom you have an accepted connection.',
      );
    }

    const sortedParticipants = [userId, participantId].sort();

    // Use atomic findOneAndUpdate with upsert to prevent race conditions
    // and duplicate conversations. The sorted order ensures [A,B] == [B,A].
    let conversation = await this.conversationModel
      .findOneAndUpdate(
        { participantIds: { $eq: sortedParticipants } },
        { $setOnInsert: { participantIds: sortedParticipants } },
        { upsert: true, new: true, runValidators: true },
      )
      .exec();

    this.logger.log(
      `Conversation resolved between ${userId} and ${participantId}`,
    );

    // Enrich with other user info (with error recovery)
    let other: any = null;
    try {
      const otherUsers = await this.usersService.findByIds([participantId]);
      other = otherUsers[0] || null;
    } catch (error) {
      this.logger.error(`Failed to fetch participant profile: ${error}`);
    }

    const plain = conversation.toObject();
    plain.id = conversation._id?.toString() ?? plain.id;
    delete plain._id;
    delete plain.__v;

    return {
      ...plain,
      otherUser: other ? this.buildOtherUser(other) : null,
    };
  }

  /**
   * List all conversations for a user, sorted by lastMessageAt descending.
   * Enriches each conversation with the other participant's user info.
   */
  async getConversations(userId: string) {
    const conversations = await this.conversationModel
      .find({ participantIds: userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .exec();

    // Collect all unique other participant IDs (coerce to string)
    const otherIds = new Set<string>();
    for (const conv of conversations) {
      const otherId = conv.participantIds.find(
        (id) => id.toString() !== userId,
      );
      if (otherId) otherIds.add(otherId.toString());
    }

    // Batch-fetch user profiles with error recovery
    let userMap = new Map<string, any>();
    try {
      const users = await this.usersService.findByIds(Array.from(otherIds));
      userMap = new Map(users.map((u) => [u._id.toString(), u]));
    } catch (error) {
      this.logger.error(
        `Failed to fetch user profiles for enrichment: ${error}`,
      );
      // Filter out any IDs that would cause a CastError
      const validIds = Array.from(otherIds).filter((id) => {
        try {
          new Types.ObjectId(id);
          return true;
        } catch {
          return false;
        }
      });
      if (validIds.length > 0) {
        try {
          const users = await this.usersService.findByIds(validIds);
          userMap = new Map(users.map((u) => [u._id.toString(), u]));
        } catch (retryError) {
          this.logger.error(
            `Retry fetch for ${validIds.length} valid users also failed: ${retryError}`,
          );
        }
      }
    }

    // Enrich conversations
    return conversations.map((conv) => {
      const otherId = conv.participantIds.find(
        (id) => id.toString() !== userId,
      );
      const otherUser = otherId ? userMap.get(otherId.toString()) : null;
      const plain = conv.toObject();
      plain.id = conv._id?.toString() ?? plain.id;
      delete plain._id;
      delete plain.__v;
      return {
        ...plain,
        otherUser: otherUser ? this.buildOtherUser(otherUser) : null,
      };
    });
  }

  /**
   * Get paginated messages for a conversation.
   * Verifies the user is a participant.
   *
   * When `afterMessageId` is provided, returns only messages created after
   * that message's timestamp. This enables efficient cursor-based polling
   * so the frontend only receives new messages instead of re-fetching all.
   */
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
    afterMessageId?: string,
  ): Promise<{
    messages: MessageDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.some((id) => id.toString() === userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Cursor-based filtering: only fetch messages after a given message
    if (afterMessageId) {
      const afterMessage = await this.messageModel
        .findById(afterMessageId)
        .exec();
      if (!afterMessage) {
        throw new NotFoundException('Cursor message not found');
      }

      const messages = await this.messageModel
        .find({
          conversationId,
          createdAt: { $gt: afterMessage.createdAt },
        })
        .sort({ createdAt: 1 })
        .limit(limit)
        .exec();

      return { messages, total: messages.length, page: 1, limit };
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ conversationId }).exec(),
    ]);

    return { messages, total, page, limit };
  }

  /**
   * Send a message in a conversation.
   * Updates the conversation's lastMessageAt and lastMessagePreview.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    options: SendMessageOptions = {},
  ): Promise<MessageDocument> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.some((id) => id.toString() === senderId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Ensure the sender still has an accepted connection with the other participant
    const otherParticipantId = conversation.participantIds
      .find((id) => id.toString() !== senderId)
      ?.toString();
    if (otherParticipantId) {
      const { allowed, status } =
        await this.connectionsService.hasAcceptedConnection(
          senderId,
          otherParticipantId,
        );
      if (!allowed) {
        if (status === 'pending') {
          throw new ForbiddenException(
            'Connection request is pending. Please wait for the other user to accept before messaging.',
          );
        }
        throw new ForbiddenException(
          'You can only message users with whom you have an accepted connection.',
        );
      }
    }

    const type = options.type ?? 'text';

    const message = await this.messageModel.create({
      conversationId,
      senderId,
      content: content ?? '',
      type,
      mediaUrl: options.mediaUrl ?? null,
      cardData: options.cardData ?? null,
      encrypted: options.encrypted ?? false,
    });

    // Update conversation metadata
    const preview = this.buildPreview(content, type);

    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $set: { lastMessageAt: new Date(), lastMessagePreview: preview },
      })
      .exec();

    // Clear typing status for this user after sending
    this.clearTyping(conversationId, senderId);

    // Send push notification to recipient
    try {
      const recipientId = otherParticipantId;
      if (recipientId) {
        const sender = await this.usersService.findById(senderId);
        const senderName = sender?.displayName || sender?.email || 'Someone';
        const body = this.buildPreview(content, type);

        this.pushService
          .sendPush(recipientId, senderName, body, {
            type: 'message',
            id: conversationId,
            senderName: senderName,
            senderAvatar: sender?.avatarUrl || '',
            link: `/messages/${conversationId}`,
          })
          .catch(() => {}); // fire-and-forget
      }
    } catch {
      // Don't fail the message send if push fails
    }

    return message;
  }

  /**
   * Set the typing status for a user in a conversation.
   */
  async setTyping(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (!conversation.participantIds.some((id) => id.toString() === userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    if (!this.typingStatus.has(conversationId)) {
      this.typingStatus.set(conversationId, new Map());
    }
    this.typingStatus.get(conversationId)!.set(userId, Date.now());
  }

  /**
   * Clear the typing status for a user in a conversation.
   */
  clearTyping(conversationId: string, userId: string): void {
    const users = this.typingStatus.get(conversationId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.typingStatus.delete(conversationId);
      }
    }
  }

  /**
   * Get typing users in a conversation, excluding the requesting user.
   * Only returns entries within TTL.
   */
  async getTypingUsers(
    conversationId: string,
    requestingUserId: string,
  ): Promise<{ userId: string }[]> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      !conversation.participantIds.some(
        (id) => id.toString() === requestingUserId,
      )
    ) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const now = Date.now();
    const users = this.typingStatus.get(conversationId);
    if (!users) {
      return [];
    }

    const result: { userId: string }[] = [];
    for (const [userId, timestamp] of users.entries()) {
      if (userId !== requestingUserId && now - timestamp <= this.TYPING_TTL) {
        result.push({ userId });
      }
    }
    return result;
  }

  /**
   * Mark all messages in a conversation as read for the given user.
   * Marks only messages where senderId !== userId (i.e. messages from the other participant).
   */
  async markAsRead(conversationId: string, userId: string): Promise<number> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.some((id) => id.toString() === userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const result = await this.messageModel
      .updateMany(
        {
          conversationId,
          senderId: { $ne: userId },
          read: false,
        },
        {
          $set: { read: true, readAt: new Date() },
        },
      )
      .exec();

    this.logger.log(
      `Marked ${result.modifiedCount} messages as read in conversation ${conversationId} for user ${userId}`,
    );

    return result.modifiedCount;
  }

  /**
   * Delete a message. Only the sender can delete their own message.
   * If the deleted message was the last one, updates the conversation preview.
   */
  async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.some((id) => id.toString() === userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const message = await this.messageModel.findById(messageId).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(messageId).exec();

    // If this was the last message, update conversation preview
    if (
      conversation.lastMessageAt &&
      message.createdAt &&
      new Date(message.createdAt).getTime() >=
        new Date(conversation.lastMessageAt).getTime() - 1000
    ) {
      const previousMessage = await this.messageModel
        .findOne({ conversationId })
        .sort({ createdAt: -1 })
        .exec();

      if (previousMessage) {
        const preview =
          previousMessage.content.length > 100
            ? previousMessage.content.substring(0, 97) + '...'
            : previousMessage.content;
        await this.conversationModel.findByIdAndUpdate(conversationId, {
          $set: {
            lastMessageAt: previousMessage.createdAt,
            lastMessagePreview: preview,
          },
        });
      } else {
        await this.conversationModel.findByIdAndUpdate(conversationId, {
          $set: { lastMessageAt: null, lastMessagePreview: '' },
        });
      }
    }

    this.logger.log(
      `Message ${messageId} deleted by user ${userId} in conversation ${conversationId}`,
    );
  }

  /**
   * Get total unread message count across all conversations for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationModel
      .find({ participantIds: userId })
      .exec();

    const conversationIds = conversations.map((c) => c._id.toString());

    if (conversationIds.length === 0) {
      return 0;
    }

    const count = await this.messageModel
      .countDocuments({
        conversationId: { $in: conversationIds },
        senderId: { $ne: userId },
        read: false,
      })
      .exec();

    return count;
  }

  /**
   * One-line summary of a message for the conversation list and push bodies.
   * Non-text messages have no meaningful body of their own.
   */
  private buildPreview(content: string, type: MessageType): string {
    const body = (content ?? '').trim();

    if (type === 'image') {
      return body ? `📷 ${this.truncate(body)}` : '📷 Photo';
    }
    if (type === 'card-share') {
      return body ? `📇 ${this.truncate(body)}` : '📇 Shared a card';
    }
    return this.truncate(body);
  }

  private truncate(value: string, max = 100): string {
    return value.length > max ? `${value.substring(0, max - 3)}...` : value;
  }

  /**
   * Ids of every conversation the user belongs to.
   *
   * Deliberately lean: the gateway calls this on each socket connect purely to
   * work out which rooms to join, and does not need the profile enrichment
   * getConversations() performs.
   */
  async getConversationIdsForUser(userId: string): Promise<string[]> {
    const conversations = await this.conversationModel
      .find({ participantIds: userId })
      .select('_id')
      .lean()
      .exec();

    return conversations.map((c: any) => c._id.toString());
  }

  /** Participant ids of a single conversation, or [] if it no longer exists. */
  async getParticipantIds(conversationId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(conversationId)) {
      return [];
    }

    const conversation = await this.conversationModel
      .findById(conversationId)
      .select('participantIds')
      .lean()
      .exec();

    return ((conversation as any)?.participantIds ?? []).map((id: any) =>
      id.toString(),
    );
  }

  /**
   * Every user the given user shares a conversation with. Used to scope
   * presence lookups so online status is not readable for arbitrary accounts.
   */
  async getConversationPartnerIds(userId: string): Promise<string[]> {
    const conversations = await this.conversationModel
      .find({ participantIds: userId })
      .select('participantIds')
      .lean()
      .exec();

    const partners = new Set<string>();
    for (const conv of conversations as any[]) {
      for (const id of conv.participantIds ?? []) {
        const value = id.toString();
        if (value !== userId) partners.add(value);
      }
    }

    return Array.from(partners);
  }

  /**
   * Load a conversation and confirm the user belongs to it.
   * Shared by the endpoints and by the websocket gateway, which does not go
   * through the HTTP guards.
   */
  async assertParticipant(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participantIds.some((id) => id.toString() === userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return conversation;
  }

  /**
   * Substring search over the messages of one conversation.
   *
   * The query is escaped before being used as a regex — an unescaped user
   * string would let a caller inject a pattern and force catastrophic
   * backtracking against every message in the conversation.
   */
  async searchMessages(
    conversationId: string,
    query: string,
    userId: string,
    limit = 50,
  ): Promise<MessageDocument[]> {
    await this.assertParticipant(conversationId, userId);

    const term = (query ?? '').trim();
    if (!term) {
      return [];
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return this.messageModel
      .find({
        conversationId,
        content: { $regex: escaped, $options: 'i' },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Reactions become Mongo update paths, so the key must stay path-safe. */
  private assertValidEmoji(emoji: string): string {
    const value = (emoji ?? '').trim();
    if (!value || value.length > 16 || /[.$\s]/.test(value)) {
      throw new BadRequestException('Invalid emoji');
    }
    return value;
  }

  private async findMessageInConversation(
    conversationId: string,
    messageId: string,
  ): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }

    const message = await this.messageModel.findById(messageId).exec();

    // Check the message actually belongs to the conversation the caller was
    // authorised against, so a participant of one chat cannot react to a
    // message in another simply by passing its id.
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  /** Add the user to the given emoji's reaction list. Idempotent. */
  async addReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageDocument> {
    await this.assertParticipant(conversationId, userId);
    const key = this.assertValidEmoji(emoji);
    await this.findMessageInConversation(conversationId, messageId);

    const updated = await this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $addToSet: { [`reactions.${key}`]: userId } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Message not found');
    }

    return updated;
  }

  /**
   * Remove the user from the given emoji's reaction list, dropping the key
   * entirely once nobody is left so the object does not accumulate empties.
   */
  async removeReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageDocument> {
    await this.assertParticipant(conversationId, userId);
    const key = this.assertValidEmoji(emoji);
    await this.findMessageInConversation(conversationId, messageId);

    let updated = await this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $pull: { [`reactions.${key}`]: userId } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Message not found');
    }

    const remaining = (updated.reactions ?? {})[key];
    if (Array.isArray(remaining) && remaining.length === 0) {
      updated = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          { $unset: { [`reactions.${key}`]: '' } },
          { new: true },
        )
        .exec();
    }

    if (!updated) {
      throw new NotFoundException('Message not found');
    }

    return updated;
  }
}
