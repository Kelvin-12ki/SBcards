import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './entities/activity.entity';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  /**
   * Record a new activity for a user.
   */
  async record(
    userId: string,
    action: string,
    metadata: Record<string, any> = {},
    isPublic = false,
  ): Promise<ActivityDocument> {
    const activity = await this.activityModel.create({
      userId,
      action,
      metadata,
      public: isPublic,
    });

    this.logger.log(`Activity recorded: user=${userId} action=${action}`);

    return activity;
  }

  /**
   * Get the current user's own activity feed, paginated, newest first.
   */
  async getUserFeed(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ activities: ActivityDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments({ userId }).exec(),
    ]);

    return { activities, total, page, limit };
  }

  /**
   * Get activities for participants of an event, filtered by metadata.eventId.
   */
  async getEventFeed(
    eventId: string,
    _participantIds: string[],
    page = 1,
    limit = 50,
  ): Promise<{ activities: ActivityDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const filter = {
      'metadata.eventId': eventId,
      userId: { $in: _participantIds },
    };

    const [activities, total] = await Promise.all([
      this.activityModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments(filter).exec(),
    ]);

    return { activities, total, page, limit };
  }

  /**
   * Get activities from a user's connections.
   */
  async getConnectionFeed(
    _userId: string,
    connectionIds: string[],
    page = 1,
    limit = 50,
  ): Promise<{ activities: ActivityDocument[]; total: number; page: number; limit: number }> {
    if (connectionIds.length === 0) {
      return { activities: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityModel
        .find({ userId: { $in: connectionIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments({ userId: { $in: connectionIds } }).exec(),
    ]);

    return { activities, total, page, limit };
  }
}
