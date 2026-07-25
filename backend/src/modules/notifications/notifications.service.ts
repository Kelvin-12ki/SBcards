import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Create a notification for a user.
   */
  async create(
    userId: string,
    type: string,
    title: string,
    body?: string,
    link?: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      userId,
      type,
      title,
      body,
      link,
    });

    this.logger.log(`Notification created: user=${userId} type=${type}`);

    return notification;
  }

  /**
   * Get all notifications for a user, paginated, newest first.
   */
  async findAll(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: NotificationDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments({ userId }).exec(),
    ]);

    return { notifications, total, page, limit };
  }

  /**
   * Get unread notifications for a user.
   */
  async getUnread(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId, read: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ userId, read: false })
      .exec();
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { $set: { read: true, readAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found`,
      );
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel
      .updateMany(
        { userId, read: false },
        { $set: { read: true, readAt: new Date() } },
      )
      .exec();

    this.logger.log(
      `Marked ${result.modifiedCount} notifications as read for user ${userId}`,
    );

    return result.modifiedCount;
  }

  /**
   * Delete a notification by ID.
   */
  async delete(notificationId: string): Promise<void> {
    const result = await this.notificationModel
      .findByIdAndDelete(notificationId)
      .exec();

    if (!result) {
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found`,
      );
    }
  }
}
