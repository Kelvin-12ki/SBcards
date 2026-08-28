import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Send a push notification to a user via FCM.
   * Silently fails if the user has no token or the token is invalid.
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      // Check if Firebase Admin is initialized
      if (!admin.apps.length) {
        this.logger.error('Firebase Admin NOT initialized — push skipped. Check FIREBASE env vars on Render.');
        return;
      }

      const user = await this.userModel.findById(userId).exec();
      if (!user || !user.fcmToken) {
        this.logger.debug(`No FCM token for user ${userId} — push skipped`);
        return;
      }

      this.logger.log(`Sending push to user ${userId} (token: ${user.fcmToken.substring(0, 20)}...)`);
      const result = await admin.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: data || {},
        webpush: {
          fcmOptions: {
            link: data?.link || 'https://nexas.vercel.app/messages',
          },
          notification: {
            icon: '/sing-192x192.png',
            badge: '/sing-50x50.png',
          },
        },
      });

      this.logger.log(`Push notification sent to user ${userId}, messageId: ${result}`);
    } catch (error: any) {
      // Handle stale/invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(`Clearing stale FCM token for user ${userId}`);
        await this.userModel
          .findByIdAndUpdate(userId, { $unset: { fcmToken: '' } })
          .exec();
      } else {
        this.logger.error(`Push notification failed for user ${userId}: ${error.message}`);
      }
    }
  }
}
