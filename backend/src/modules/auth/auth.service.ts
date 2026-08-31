import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { EmailService } from '../notifications/email.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { Connection, ConnectionDocument } from '../connections/entities/connection.entity';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
  ) {}

  /**
   * Verify a Firebase ID token, upsert the user in DB, and return a JWT + user.
   */
  async verifyFirebaseToken(
    idToken: string,
  ): Promise<{ accessToken: string; user: UserDocument }> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { uid, email, name, picture } = decodedToken;

      if (!email) {
        throw new UnauthorizedException(
          'Email is required from Firebase authentication',
        );
      }

      // Check if user already exists (before upsert)
      const existingUser = await this.usersService.findByFirebaseUid(uid);

      // Upsert user in database
      const user = await this.usersService.upsertFirebaseUser(
        uid,
        email,
        name || null,
      );

      // Update avatar if provided
      if (picture && user.avatarUrl !== picture) {
        await this.usersService.update(user.id, { avatarUrl: picture });
        user.avatarUrl = picture;
      }

      // Send welcome email to new users (fire-and-forget)
      if (!existingUser) {
        const displayName = name || email.split('@')[0];
        this.emailService.sendWelcomeEmail(email, displayName).catch((err) => {
          this.logger.error(`Failed to send welcome email: ${(err as Error).message}`);
        });
      }

      // Generate JWT
      const accessToken = this.generateToken(user);

      return { accessToken, user };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Firebase token verification failed: ${(error as Error).message}`,
      );
      throw new UnauthorizedException(
        'Invalid or expired Firebase authentication token',
      );
    }
  }

  /**
   * Generate a JWT access token for a given user.
   */
  generateToken(user: UserDocument): string {
    const payload = {
      sub: user.id,
      uid: user.firebaseUid,
      email: user.email,
      role: user.role || 'user',
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Validate a user by ID. Used by JWT strategy if needed.
   */
  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Apply for organizer role. Checks ALL criteria and returns which are met.
   */
  async applyForOrganizer(
    userId: string,
    dto: ApplyOrganizerDto,
  ): Promise<{
    success: boolean;
    criteria: Record<string, boolean>;
    message?: string;
  }> {
    const user = await this.usersService.findById(userId);

    // Check if user is already an organizer or admin
    if (user.role === 'organizer' || user.role === 'admin') {
      return {
        success: false,
        criteria: {},
        message: 'You already have organizer access',
      };
    }

    // Check if there's already a pending/approved request
    if (
      user.organizerRequest?.status === 'pending' ||
      user.organizerRequest?.status === 'approved'
    ) {
      return {
        success: false,
        criteria: {},
        message: user.organizerRequest.status === 'pending'
          ? 'Your application is already under review'
          : 'Your application has already been approved',
      };
    }

    // Check all criteria
    const cardsCount = await this.cardModel.countDocuments({ userId }).exec();
    const connectionsCount = await this.connectionModel
      .countDocuments({ userId })
      .exec();
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const criteria: Record<string, boolean> = {
      profileComplete: user.profileComplete === true,
      hasCards: cardsCount >= 1,
      hasConnections: connectionsCount >= 3,
      accountAge: accountAgeDays >= 7,
      hasCompany: !!dto.company?.trim(),
      hasJobTitle: !!dto.jobTitle?.trim(),
      hasReason: !!dto.reason?.trim(),
    };

    const allMet = Object.values(criteria).every(Boolean);

    if (!allMet) {
      const notMet = Object.entries(criteria)
        .filter(([, met]) => !met)
        .map(([key]) => key);
      return {
        success: false,
        criteria,
        message: `Some criteria are not met: ${notMet.join(', ')}`,
      };
    }

    // All criteria met — save the request
    await this.usersService.requestOrganizer(userId, {
      company: dto.company,
      jobTitle: dto.jobTitle,
      reason: dto.reason,
    });

    return {
      success: true,
      criteria,
      message: 'Application submitted successfully',
    };
  }

  /**
   * Get the current user's organizer application status.
   */
  async getOrganizerStatus(
    userId: string,
  ): Promise<{
    role: string;
    organizerRequest: {
      status: string;
      company?: string;
      jobTitle?: string;
      reason?: string;
      requestedAt?: Date;
      reviewedAt?: Date;
    } | null;
  }> {
    const user = await this.usersService.findById(userId);

    return {
      role: user.role,
      organizerRequest: user.organizerRequest?.status !== 'none'
        ? user.organizerRequest
        : null,
    };
  }
}
