import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Connection,
  ConnectionDocument,
} from './entities/connection.entity';
import {
  LeadQualification,
  LeadQualificationDocument,
} from './entities/lead-qualification.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { UpdateLeadQualificationDto } from './dto/update-lead-qualification.dto';
import { UsersService } from '../users/users.service';
import { CardsService } from '../cards/cards.service';
import { TimelineService } from '../timeline/timeline.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(LeadQualification.name)
    private readonly leadQualModel: Model<LeadQualificationDocument>,
    private readonly usersService: UsersService,
    private readonly cardsService: CardsService,
    private readonly timelineService: TimelineService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send a connection request from one user to another.
   * Creates a single forward connection (A→B) with status 'pending'.
   * Notifies the recipient.
   */
  async create(
    userId: string,
    data: CreateConnectionDto,
  ): Promise<ConnectionDocument> {
    // Validate connectedUserId is a valid ObjectId format
    if (!data.connectedUserId || !/^[0-9a-fA-F]{24}$/.test(data.connectedUserId)) {
      throw new NotFoundException(`User with ID "${data.connectedUserId}" not found`);
    }

    const connectedUser = await this.usersService.findById(
      data.connectedUserId,
    );
    if (!connectedUser) {
      throw new NotFoundException(
        `User with ID "${data.connectedUserId}" not found`,
      );
    }

    if (userId === data.connectedUserId) {
      throw new ConflictException('Cannot connect with yourself');
    }

    // Check if a request already exists in either direction
    const existingForward = await this.connectionModel
      .findOne({ userId, connectedUserId: data.connectedUserId })
      .exec();

    if (existingForward) {
      if (existingForward.status === 'pending') {
        throw new ConflictException('Connection request already sent');
      }
      if (existingForward.status === 'accepted') {
        throw new ConflictException('Already connected');
      }
      // If declined or archived, allow re-request: delete old one
      await this.connectionModel.findByIdAndDelete(existingForward._id).exec();
    }

    // Check reverse: did they already request us?
    const existingReverse = await this.connectionModel
      .findOne({ userId: data.connectedUserId, connectedUserId: userId })
      .exec();

    if (existingReverse) {
      if (existingReverse.status === 'pending') {
        // They already sent us a request — auto-accept both sides
        return this.acceptRequest(existingReverse._id.toString(), userId);
      }
      if (existingReverse.status === 'accepted') {
        throw new ConflictException('Already connected');
      }
    }

    const source = data.source || 'profile';

    // Create the forward connection request (A→B)
    const connection = await this.connectionModel.create({
      userId,
      connectedUserId: data.connectedUserId,
      connectedCardId: data.connectedCardId,
      eventId: data.eventId,
      source,
      notes: data.notes,
      status: 'pending',
    });

    // Notify the recipient
    try {
      const sender = await this.usersService.findById(userId);

      await this.notificationsService.create(
        data.connectedUserId,
        'connection_request',
        'New Connection Request',
        `${sender?.displayName || sender?.email || 'Someone'} wants to connect with you.`,
        `/connections`,
      );

      // Send push notification
      this.pushService.sendPush(
        data.connectedUserId,
        'New Connection Request',
        `${sender?.displayName || sender?.email || 'Someone'} wants to connect with you.`,
        { type: 'connection_request', id: connection._id.toString(), senderName: sender?.displayName || '', senderAvatar: sender?.avatarUrl || '' },
      ).catch(() => {});

      await this.timelineService.record(data.connectedUserId, 'connection_request', {
        connectionId: connection._id.toString(),
        targetUserName: sender?.displayName || sender?.email || 'Unknown',
        targetUserAvatar: sender?.avatarUrl || '',
      });

      // Send email notification to recipient
      const recipient = await this.usersService.findById(data.connectedUserId);
      if (recipient?.email) {
        this.emailService.sendConnectionRequestEmail(
          recipient.email,
          sender?.displayName || sender?.email || 'Someone',
          sender?.email || '',
        ).catch((err) => {
          this.logger.error(`Failed to send connection email: ${(err as Error).message}`);
        });
      }
    } catch (hookError) {
      this.logger.error(
        `Failed to send notification for connection request: ${(hookError as Error).message}`,
      );
    }

    this.logger.log(
      `Connection request sent: ${userId} → ${data.connectedUserId}`,
    );

    return connection;
  }

  /**
   * Accept a connection request.
   * Updates the incoming request to 'accepted' and creates a reverse connection.
   */
  async acceptRequest(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDocument> {
    const connection = await this.connectionModel
      .findById(connectionId)
      .exec();

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Only the recipient can accept
    if (connection.connectedUserId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    if (connection.status !== 'pending') {
      throw new ConflictException(`Connection is already ${connection.status}`);
    }

    // Update the incoming request to accepted
    const updated = await this.connectionModel
      .findByIdAndUpdate(
        connectionId,
        { $set: { status: 'accepted' } },
        { new: true },
      )
      .exec();

    // NOTE: We no longer create a reverse connection record.
    // Both users can find the connection by checking either direction.
    // This prevents duplicate records that cause stale "Connected" status after decline.

    // Notify the original sender that their request was accepted
    try {
      const acceptor = await this.usersService.findById(userId);

      await this.notificationsService.create(
        connection.userId,
        'connection_accepted',
        'Request Accepted!',
        `${acceptor?.displayName || acceptor?.email || 'Someone'} accepted your connection request.`,
        `/connections`,
      );

      // Send push notification
      this.pushService.sendPush(
        connection.userId,
        'Request Accepted!',
        `${acceptor?.displayName || acceptor?.email || 'Someone'} accepted your connection request.`,
        { type: 'connection_accepted', id: connection._id.toString(), senderName: acceptor?.displayName || '', senderAvatar: acceptor?.avatarUrl || '' },
      ).catch(() => {});

      await this.timelineService.record(connection.userId, 'connected', {
        connectionId: connection._id.toString(),
        targetUserName: acceptor?.displayName || acceptor?.email || 'Unknown',
        targetUserAvatar: acceptor?.avatarUrl || '',
      });

      await this.timelineService.record(userId, 'connected', {
        connectionId: connection._id.toString(),
        targetUserName: acceptor?.displayName || acceptor?.email || 'Unknown',
        targetUserAvatar: acceptor?.avatarUrl || '',
      });
    } catch (hookError) {
      this.logger.error(
        `Failed to notify after accept: ${(hookError as Error).message}`,
      );
    }

    this.logger.log(
      `Connection accepted: ${connection.userId} ↔ ${userId}`,
    );

    return updated;
  }

  /**
   * Decline a connection request.
   */
  async declineRequest(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDocument> {
    const connection = await this.connectionModel
      .findById(connectionId)
      .exec();

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.connectedUserId !== userId) {
      throw new ForbiddenException('You can only decline requests sent to you');
    }

    if (connection.status !== 'pending') {
      throw new ConflictException(`Connection is already ${connection.status}`);
    }

    const updated = await this.connectionModel
      .findByIdAndUpdate(
        connectionId,
        { $set: { status: 'declined' } },
        { new: true },
      )
      .exec();

    // Also decline/remove the reverse connection if it exists
    await this.connectionModel
      .findOneAndDelete({
        userId: connection.connectedUserId,
        connectedUserId: connection.userId,
      })
      .exec();

    // Notify the sender
    try {
      const decliner = await this.usersService.findById(userId);

      await this.notificationsService.create(
        connection.userId,
        'connection_declined',
        'Request Declined',
        `${decliner?.displayName || decliner?.email || 'Someone'} declined your connection request.`,
        `/connections`,
      );
    } catch (hookError) {
      this.logger.error(
        `Failed to notify after decline: ${(hookError as Error).message}`,
      );
    }

    this.logger.log(
      `Connection declined: ${connection.userId} → ${userId}`,
    );

    return updated;
  }

  /**
   * Cancel (withdraw) an outgoing connection request.
   */
  async cancelRequest(
    connectionId: string,
    userId: string,
  ): Promise<void> {
    const connection = await this.connectionModel
      .findById(connectionId)
      .exec();

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (connection.status !== 'pending') {
      throw new ConflictException(`Connection is already ${connection.status}`);
    }

    await this.connectionModel.findByIdAndDelete(connectionId).exec();

    this.logger.log(
      `Connection request cancelled: ${userId} → ${connection.connectedUserId}`,
    );
  }

  /**
   * Find incoming pending requests for a user (where they are the recipient).
   */
  async findIncomingRequests(
    userId: string,
  ): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({ connectedUserId: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find outgoing pending requests for a user (where they are the sender).
   */
  async findOutgoingRequests(
    userId: string,
  ): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({ userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Count incoming pending requests.
   */
  async countIncomingRequests(userId: string): Promise<number> {
    return this.connectionModel
      .countDocuments({ connectedUserId: userId, status: 'pending' })
      .exec();
  }

  /**
   * Check if two users have an accepted connection (in either direction).
   * Returns { allowed, status } where allowed is true only if status === 'accepted'.
   */
  async hasAcceptedConnection(userIdA: string, userIdB: string): Promise<{ allowed: boolean; status: string | null }> {
    const accepted = await this.connectionModel.findOne({
      $or: [
        { userId: userIdA, connectedUserId: userIdB },
        { userId: userIdB, connectedUserId: userIdA },
      ],
      status: 'accepted',
    }).exec();

    if (accepted) return { allowed: true, status: 'accepted' };

    // Check if any connection exists (any status) for a better error message
    const any = await this.connectionModel.findOne({
      $or: [
        { userId: userIdA, connectedUserId: userIdB },
        { userId: userIdB, connectedUserId: userIdA },
      ],
    }).exec();

    return { allowed: false, status: any?.status || null };
  }

  /**
   * Find all connections for a user with optional filters.
   */
  async findAllForUser(
    userId: string,
    filters?: {
      tag?: string;
      status?: string;
      search?: string;
      leadScore?: string;
    },
  ): Promise<ConnectionDocument[]> {
    // Check both directions: user sent the request OR received it
    const query: any = {
      $or: [{ userId }, { connectedUserId: userId }],
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.tag) {
      query.tags = filters.tag;
    }

    if (filters?.search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { notes: { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } },
        ],
      });
    }

    // If filtering by lead score, first find matching connection IDs
    if (filters?.leadScore) {
      const matchingQuals = await this.leadQualModel
        .find({ userId, leadScore: filters.leadScore })
        .select('connectionId')
        .exec();
      const matchingConnectionIds = matchingQuals.map((q) => q.connectionId);
      query._id = { $in: matchingConnectionIds };
    }

    return this.connectionModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find all favorited connections for a user.
   */
  async findFavorites(userId: string): Promise<ConnectionDocument[]> {
    return this.connectionModel
      .find({ userId, isFavorite: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find a single connection by ID.
   * Allows access if the user is either the sender or recipient.
   */
  async findById(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDocument> {
    const connection = await this.connectionModel
      .findById(connectionId)
      .exec();

    if (!connection) {
      throw new NotFoundException(
        `Connection with ID "${connectionId}" not found`,
      );
    }

    // Allow both sender and recipient to view
    if (connection.userId !== userId && connection.connectedUserId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this connection',
      );
    }

    return connection;
  }

  /**
   * Update a connection's fields.
   */
  async update(
    connectionId: string,
    userId: string,
    data: UpdateConnectionDto,
  ): Promise<ConnectionDocument> {
    const connection = await this.findById(connectionId, userId);

    const updateData: Record<string, any> = {};

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate;
    if (data.followUpNote !== undefined) updateData.followUpNote = data.followUpNote;

    const updated = await this.connectionModel
      .findByIdAndUpdate(
        connectionId,
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `Connection with ID "${connectionId}" not found`,
      );
    }

    return updated;
  }

  /**
   * Remove a connection (and its reverse) by ID.
   */
  async remove(connectionId: string, userId: string): Promise<void> {
    const connection = await this.findById(connectionId, userId);

    await this.connectionModel.findByIdAndDelete(connectionId).exec();

    // Remove the reverse connection if it exists
    await this.connectionModel
      .findOneAndDelete({
        userId: connection.connectedUserId,
        connectedUserId: userId,
      })
      .exec();

    this.logger.log(
      `Connection removed: ${connection.userId} ↔ ${connection.connectedUserId}`,
    );
  }

  /**
   * Toggle the favorite status of a connection.
   */
  async toggleFavorite(
    connectionId: string,
    userId: string,
  ): Promise<ConnectionDocument> {
    const connection = await this.findById(connectionId, userId);

    connection.isFavorite = !connection.isFavorite;
    return connection.save();
  }

  /**
   * Add a tag to multiple connections at once.
   */
  async bulkTag(
    connectionIds: string[],
    userId: string,
    tag: string,
  ): Promise<number> {
    const result = await this.connectionModel
      .updateMany(
        {
          _id: { $in: connectionIds },
          userId,
        },
        { $addToSet: { tags: tag } },
      )
      .exec();

    this.logger.log(
      `Bulk tag: Added tag "${tag}" to ${result.modifiedCount} connections for user ${userId}`,
    );

    return result.modifiedCount;
  }

  /**
   * Create an accepted connection from a QR code scan.
   * - Validates both users exist
   * - Prevents self-connection
   * - If already accepted, throws ConflictException
   * - If pending request exists in either direction, accepts it
   * - Otherwise creates two accepted connection records (A→B and B→A) with source 'qr_scan'
   */
  async createFromQrScan(
    scannerUserId: string,
    scannedUserId: string,
  ): Promise<ConnectionDocument> {
    // Validate both users exist
    const scanner = await this.usersService.findById(scannerUserId);
    if (!scanner) {
      throw new NotFoundException(`Scanner user with ID "${scannerUserId}" not found`);
    }

    const scannedUser = await this.usersService.findById(scannedUserId);
    if (!scannedUser) {
      throw new NotFoundException(`Scanned user with ID "${scannedUserId}" not found`);
    }

    // Prevent self-connection
    if (scannerUserId === scannedUserId) {
      throw new ConflictException('Cannot connect with yourself');
    }

    // Check for existing connections in both directions
    const existingForward = await this.connectionModel
      .findOne({ userId: scannerUserId, connectedUserId: scannedUserId })
      .exec();

    if (existingForward) {
      if (existingForward.status === 'accepted') {
        throw new ConflictException('Already connected');
      }
      if (existingForward.status === 'pending') {
        // Accept the pending request
        const updated = await this.connectionModel
          .findByIdAndUpdate(
            existingForward._id,
            { $set: { status: 'accepted', source: 'qr_scan' } },
            { new: true },
          )
          .exec();

        await this.sendQrConnectionNotifications(scannerUserId, scannedUserId, scanner, scannedUser);

        this.logger.log(`QR scan: accepted existing pending connection ${scannerUserId} → ${scannedUserId}`);

        return updated!;
      }
    }

    const existingReverse = await this.connectionModel
      .findOne({ userId: scannedUserId, connectedUserId: scannerUserId })
      .exec();

    if (existingReverse) {
      if (existingReverse.status === 'accepted') {
        throw new ConflictException('Already connected');
      }
      if (existingReverse.status === 'pending') {
        // Accept the pending request (reverse direction)
        const updated = await this.connectionModel
          .findByIdAndUpdate(
            existingReverse._id,
            { $set: { status: 'accepted', source: 'qr_scan' } },
            { new: true },
          )
          .exec();

        await this.sendQrConnectionNotifications(scannerUserId, scannedUserId, scanner, scannedUser);

        this.logger.log(`QR scan: accepted existing pending reverse connection ${scannedUserId} → ${scannerUserId}`);

        return updated!;
      }
    }

    // Create a single accepted connection record (A→B) — the system
    // looks up connections in both directions so one record suffices.
    const connection = await this.connectionModel.create({
      userId: scannerUserId,
      connectedUserId: scannedUserId,
      status: 'accepted',
      source: 'qr_scan',
    });

    // Send notifications to both users
    await this.sendQrConnectionNotifications(scannerUserId, scannedUserId, scanner, scannedUser);

    this.logger.log(
      `QR scan: accepted connection created between ${scannerUserId} ↔ ${scannedUserId}`,
    );

    return connection;
  }

  /**
   * Send notifications for a QR scan connection.
   */
  private async sendQrConnectionNotifications(
    scannerUserId: string,
    scannedUserId: string,
    scanner: any,
    scannedUser: any,
  ): Promise<void> {
    try {
      await this.notificationsService.create(
        scannedUserId,
        'connection_accepted',
        'New Connection!',
        `${scanner?.displayName || scanner?.email || 'Someone'} connected with you via QR scan.`,
        `/connections`,
      );

      // Send push notification
      this.pushService.sendPush(
        scannedUserId,
        'New Connection!',
        `${scanner?.displayName || scanner?.email || 'Someone'} connected with you via QR scan.`,
        { type: 'connection_accepted', id: '', senderName: scanner?.displayName || '', senderAvatar: scanner?.avatarUrl || '' },
      ).catch(() => {});

      await this.timelineService.record(scannedUserId, 'connected', {
        connectionId: '',
        targetUserName: scanner?.displayName || scanner?.email || 'Unknown',
        targetUserAvatar: scanner?.avatarUrl || '',
      });

      await this.notificationsService.create(
        scannerUserId,
        'connection_accepted',
        'New Connection!',
        `${scannedUser?.displayName || scannedUser?.email || 'Someone'} connected with you via QR scan.`,
        `/connections`,
      );

      // Send push notification
      this.pushService.sendPush(
        scannerUserId,
        'New Connection!',
        `${scannedUser?.displayName || scannedUser?.email || 'Someone'} connected with you via QR scan.`,
        { type: 'connection_accepted', id: '', senderName: scannedUser?.displayName || '', senderAvatar: scannedUser?.avatarUrl || '' },
      ).catch(() => {});

      await this.timelineService.record(scannerUserId, 'connected', {
        connectionId: '',
        targetUserName: scannedUser?.displayName || scannedUser?.email || 'Unknown',
        targetUserAvatar: scannedUser?.avatarUrl || '',
      });
    } catch (hookError) {
      this.logger.error(
        `Failed to send QR connection notifications: ${(hookError as Error).message}`,
      );
    }
  }

  /**
   * Enrich a connection document with user and card display info.
   * When currentUserId is provided, also returns 'otherUser' (the person who isn't the viewer).
   */
  async getEnrichedConnection(
    connection: ConnectionDocument,
    currentUserId?: string,
  ): Promise<Record<string, any>> {
    let connectedUser = null;
    let senderUser = null;
    let connectedCard = null;

    try {
      connectedUser = await this.usersService.findById(
        connection.connectedUserId,
      );
    } catch {
      // User may have been deleted
    }

    try {
      senderUser = await this.usersService.findById(
        connection.userId,
      );
    } catch {
      // User may have been deleted
    }

    if (connection.connectedCardId) {
      try {
        connectedCard = await this.cardsService.findById(
          connection.connectedCardId,
        );
      } catch {
        // Card may have been deleted
      }
    }

    const plain = connection.toJSON();

    const connectedUserData = connectedUser
      ? {
          id: connectedUser._id?.toString() ?? connectedUser.id,
          displayName: connectedUser.displayName,
          email: connectedUser.email,
          avatarUrl: connectedUser.avatarUrl,
          title: connectedUser.title,
          company: connectedUser.company,
          industry: connectedUser.industry,
          jobRole: connectedUser.jobRole,
        }
      : null;

    const senderUserData = senderUser
      ? {
          id: senderUser._id?.toString() ?? senderUser.id,
          displayName: senderUser.displayName,
          email: senderUser.email,
          avatarUrl: senderUser.avatarUrl,
          title: senderUser.title,
          company: senderUser.company,
          industry: senderUser.industry,
          jobRole: senderUser.jobRole,
        }
      : null;

    // Compute the "other user" — the person who isn't the current viewer
    let otherUser = null;
    if (currentUserId) {
      if (connection.userId === currentUserId) {
        // I sent this connection, so the other person is connectedUserId
        otherUser = connectedUserData;
      } else {
        // They sent this connection, so the other person is userId (sender)
        otherUser = senderUserData;
      }
    } else {
      // No current user context — default to connectedUser
      otherUser = connectedUserData;
    }

    const result = {
      ...plain,
      connectedUser: connectedUserData,
      senderUser: senderUserData,
      otherUser,
      connectedCard: connectedCard
        ? {
            id: connectedCard._id?.toString() ?? connectedCard.id,
            fullName: connectedCard.fullName,
            headline: connectedCard.headline,
            company: connectedCard.company,
            role: connectedCard.role,
          }
        : null,
    };

    // Enrich with lead qualification data if current user is known
    if (currentUserId) {
      return this.enrichWithLeadQualification(result, currentUserId);
    }

    return result;
  }

  // ────────── LEAD QUALIFICATION ──────────

  /**
   * Get or create a lead qualification record for a user + connection pair.
   */
  async getOrCreateLeadQualification(
    userId: string,
    connectionId: string,
  ): Promise<LeadQualificationDocument> {
    let qual = await this.leadQualModel.findOne({ userId, connectionId }).exec();
    if (!qual) {
      qual = await this.leadQualModel.create({ userId, connectionId });
    }
    return qual;
  }

  /**
   * Update lead qualification (score, follow-up status, tags) for a connection.
   */
  async updateLeadQualification(
    connectionId: string,
    userId: string,
    dto: UpdateLeadQualificationDto,
  ): Promise<Record<string, any>> {
    // Verify user has access to this connection
    await this.findById(connectionId, userId);

    const qual = await this.getOrCreateLeadQualification(userId, connectionId);

    const updateData: Record<string, any> = {};
    if (dto.leadScore !== undefined) updateData.leadScore = dto.leadScore;
    if (dto.followUpStatus !== undefined) updateData.followUpStatus = dto.followUpStatus;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    const updated = await this.leadQualModel
      .findByIdAndUpdate(qual._id, { $set: updateData }, { new: true })
      .exec();

    return this.getEnrichedConnection(
      await this.findById(connectionId, userId),
      userId,
    );
  }

  /**
   * Add a private note to a connection's lead qualification.
   */
  async addNote(
    connectionId: string,
    userId: string,
    text: string,
  ): Promise<Record<string, any>> {
    await this.findById(connectionId, userId);
    const qual = await this.getOrCreateLeadQualification(userId, connectionId);

    const note = {
      text,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.leadQualModel
      .findByIdAndUpdate(qual._id, { $push: { privateNotes: note } }, { new: true })
      .exec();

    return this.getEnrichedConnection(
      await this.findById(connectionId, userId),
      userId,
    );
  }

  /**
   * Update a private note.
   */
  async updateNote(
    connectionId: string,
    userId: string,
    noteId: string,
    text: string,
  ): Promise<Record<string, any>> {
    await this.findById(connectionId, userId);
    const qual = await this.getOrCreateLeadQualification(userId, connectionId);

    const note = (qual.privateNotes as any).id(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.createdBy !== userId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    note.text = text;
    note.updatedAt = new Date();
    await qual.save();

    return this.getEnrichedConnection(
      await this.findById(connectionId, userId),
      userId,
    );
  }

  /**
   * Delete a private note.
   */
  async deleteNote(
    connectionId: string,
    userId: string,
    noteId: string,
  ): Promise<void> {
    await this.findById(connectionId, userId);
    const qual = await this.getOrCreateLeadQualification(userId, connectionId);

    const note = (qual.privateNotes as any).id(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.leadQualModel
      .findByIdAndUpdate(qual._id, { $pull: { privateNotes: { _id: noteId } } })
      .exec();
  }

  /**
   * Enrich a connection with the current user's lead qualification data.
   */
  private async enrichWithLeadQualification(
    enriched: Record<string, any>,
    userId: string,
  ): Promise<Record<string, any>> {
    try {
      const qual = await this.leadQualModel
        .findOne({ userId, connectionId: enriched.id })
        .exec();

      if (qual) {
        enriched.leadQualification = {
          id: qual._id?.toString(),
          leadScore: qual.leadScore,
          followUpStatus: qual.followUpStatus,
          tags: qual.tags,
          privateNotes: qual.privateNotes.map((n) => ({
            id: n._id?.toString(),
            text: n.text,
            createdBy: n.createdBy,
            createdAt: n.createdAt?.toISOString(),
            updatedAt: n.updatedAt?.toISOString(),
          })),
        };
      } else {
        enriched.leadQualification = null;
      }
    } catch {
      enriched.leadQualification = null;
    }
    return enriched;
  }
}
