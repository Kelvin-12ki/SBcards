import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { Connection, ConnectionDocument } from '../connections/entities/connection.entity';
import { Event, EventDocument } from '../events/entities/event.entity';
import { EventParticipation, EventParticipationDocument } from '../events/entities/event-participation.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
  ) {}

  /**
   * Get dashboard statistics: total users, cards, connections, events,
   * new users today / this week.
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [
      totalUsers,
      totalCards,
      totalConnections,
      totalEvents,
      newUsersToday,
      newUsersThisWeek,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.cardModel.countDocuments().exec(),
      this.connectionModel.countDocuments().exec(),
      this.eventModel.countDocuments().exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfDay } }).exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfWeek } }).exec(),
    ]);

    return {
      totalUsers,
      totalCards,
      totalConnections,
      totalEvents,
      newUsersToday,
      newUsersThisWeek,
    };
  }

  /**
   * List users with pagination and optional search query.
   */
  async listUsers(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    let filter: any = {};

    if (query && query.trim()) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');
      filter = {
        $or: [
          { displayName: regex },
          { email: regex },
          { company: regex },
          { industry: regex },
          { jobRole: regex },
          { location: regex },
        ],
      };
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get full user profile with related counts.
   */
  async getUserDetail(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const [cardsCount, connectionsCount, eventsJoinedCount, eventsCreatedCount] =
      await Promise.all([
        this.cardModel.countDocuments({ userId }).exec(),
        this.connectionModel.countDocuments({ userId }).exec(),
        this.participationModel.countDocuments({ userId }).exec(),
        this.eventModel.countDocuments({ creatorId: userId }).exec(),
      ]);

    return {
      ...user.toJSON(),
      cardsCount,
      connectionsCount,
      eventsJoinedCount,
      eventsCreatedCount,
    };
  }

  /**
   * Ban a user (set status to 'banned').
   */
  async banUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { status: 'banned' } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return user;
  }

  /**
   * Suspend a user (set status to 'suspended').
   */
  async suspendUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { status: 'suspended' } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return user;
  }

  /**
   * Restore a user (set status to 'active').
   */
  async restoreUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { status: 'active' } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return user;
  }

  /**
   * Get all events with pagination.
   */
  async getAllEvents(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.eventModel
        .find()
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments().exec(),
    ]);

    // Attach participant counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const participantCount = await this.participationModel
          .countDocuments({ eventId: (event as any)._id?.toString() ?? event.id })
          .exec();
        return {
          ...event.toJSON(),
          participantCount,
        };
      }),
    );

    return {
      data: eventsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new event (admin override, no creator permission check).
   */
  async createEvent(data: Record<string, any>) {
    const eventData: any = { ...data };
    if (eventData.startDate) {
      eventData.startDate = new Date(eventData.startDate);
    }
    if (eventData.endDate) {
      eventData.endDate = new Date(eventData.endDate);
    }
    return this.eventModel.create(eventData);
  }

  /**
   * Update an event (admin override, no creator permission check).
   */
  async updateEvent(id: string, data: Record<string, any>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: "${id}"`);
    }

    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    const updateData: any = { ...data };
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    Object.assign(event, updateData);
    return event.save();
  }

  /**
   * Delete an event (admin override, no creator permission check).
   */
  async deleteEvent(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: "${id}"`);
    }

    const event = await this.eventModel.findById(id).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    await this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Get analytics data over time: users, cards, connections registrations per day.
   */
  async getAnalytics(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get aggregation pipelines for daily counts
    const [userGrowth, cardGrowth, connectionGrowth] = await Promise.all([
      this.aggregateDailyCounts(this.userModel, startDate),
      this.aggregateDailyCounts(this.cardModel, startDate),
      this.aggregateDailyCounts(this.connectionModel, startDate),
    ]);

    return {
      period,
      users: userGrowth,
      cards: cardGrowth,
      connections: connectionGrowth,
    };
  }

  /**
   * Aggregate daily document counts since startDate.
   */
  private async aggregateDailyCounts(
    model: Model<any>,
    startDate: Date,
  ): Promise<{ date: string; count: number }[]> {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 as const },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ] as PipelineStage[];

    return model.aggregate(pipeline).exec();
  }

  /**
   * Get all organizer requests (any status).
   */
  async getOrganizerRequests() {
    return this.userModel
      .find({ 'organizerRequest.status': { $ne: 'none' } })
      .select('displayName email organizerRequest avatarUrl')
      .sort({ 'organizerRequest.requestedAt': -1 })
      .exec();
  }

  /**
   * Approve an organizer request: set status to 'approved', set reviewedAt,
   * and promote user role to 'organizer'.
   */
  async approveOrganizerRequest(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (!user.organizerRequest || user.organizerRequest.status !== 'pending') {
      throw new NotFoundException('No pending organizer request found for this user');
    }

    user.organizerRequest = {
      ...user.organizerRequest,
      status: 'approved',
      reviewedAt: new Date(),
    };
    user.role = 'organizer';

    this.logger.log(`Organizer request approved for user ${userId}`);
    return user.save();
  }

  /**
   * Reject an organizer request: set status to 'rejected' and set reviewedAt.
   */
  async rejectOrganizerRequest(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid user ID: "${userId}"`);
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (!user.organizerRequest || user.organizerRequest.status !== 'pending') {
      throw new NotFoundException('No pending organizer request found for this user');
    }

    user.organizerRequest = {
      ...user.organizerRequest,
      status: 'rejected',
      reviewedAt: new Date(),
    };

    this.logger.log(`Organizer request rejected for user ${userId}`);
    return user.save();
  }

  /**
   * Get leaderboard top users by metric.
   */
  async getLeaderboard(metric: string, limit: number) {
    let results: any[] = [];

    switch (metric) {
      case 'connections': {
        const pipeline: PipelineStage[] = [
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 as const } },
          { $limit: limit },
          {
            $addFields: {
              _idObj: { $toObjectId: '$_id' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_idObj',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              count: 1,
              displayName: { $ifNull: ['$user.displayName', ''] },
              email: { $ifNull: ['$user.email', ''] },
              avatarUrl: { $ifNull: ['$user.avatarUrl', ''] },
            },
          },
        ];
        results = await this.connectionModel.aggregate(pipeline).exec();
        break;
      }
      case 'cards': {
        const pipeline: PipelineStage[] = [
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 as const } },
          { $limit: limit },
          {
            $addFields: {
              _idObj: { $toObjectId: '$_id' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_idObj',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              count: 1,
              displayName: { $ifNull: ['$user.displayName', ''] },
              email: { $ifNull: ['$user.email', ''] },
              avatarUrl: { $ifNull: ['$user.avatarUrl', ''] },
            },
          },
        ];
        results = await this.cardModel.aggregate(pipeline).exec();
        break;
      }
      case 'events_joined': {
        const pipeline: PipelineStage[] = [
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 as const } },
          { $limit: limit },
          {
            $addFields: {
              _idObj: { $toObjectId: '$_id' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_idObj',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              count: 1,
              displayName: { $ifNull: ['$user.displayName', ''] },
              email: { $ifNull: ['$user.email', ''] },
              avatarUrl: { $ifNull: ['$user.avatarUrl', ''] },
            },
          },
        ];
        results = await this.participationModel.aggregate(pipeline).exec();
        break;
      }
      default: {
        throw new NotFoundException(`Unknown metric: "${metric}"`);
      }
    }

    return { metric, data: results };
  }
}
