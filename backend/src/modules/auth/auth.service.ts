import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
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
import { SecurityService } from '../security/security.service';
import { RequestContext } from '../../common/utils/request-context';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';
import { Connection, ConnectionDocument } from '../connections/entities/connection.entity';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';

/** Maps a Firebase verification failure to a stable, dashboard-filterable code. */
function classifyTokenError(error: any): string {
  const code: string = typeof error?.code === 'string' ? error.code : '';
  if (code === 'auth/id-token-expired') return 'token_expired';
  if (code === 'auth/id-token-revoked') return 'token_revoked';
  if (code === 'auth/user-disabled') return 'account_disabled';
  if (code === 'auth/invalid-credential') return 'invalid_credential';
  if (code === 'auth/invalid-id-token' || code === 'auth/argument-error')
    return 'token_invalid';
  if (code) return code.replace(/^auth\//, '');
  return 'token_invalid';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly securityService: SecurityService,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
  ) {}

  /**
   * Verify a Firebase ID token, upsert the user in DB, and return a JWT + user.
   *
   * `ctx` carries the request metadata (IP, User-Agent, device id) and `intent`
   * is what the client says it is doing (login, register, restore, google).
   * Both are needed to write a useful auth-event row; without them the dashboard
   * cannot distinguish a signup from a page reload.
   */
  async verifyFirebaseToken(
    idToken: string,
    ctx: RequestContext = {},
    intent?: string,
  ): Promise<{ accessToken: string; user: UserDocument }> {
    let decodedToken: admin.auth.DecodedIdToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      // The token never decoded, so there is no uid/email to attach — record
      // it against the source IP, which is the signal that matters here.
      const failureReason = classifyTokenError(error);
      this.logger.warn(`Token verification failed: ${failureReason}`);
      await this.recordAuthEvent({
        eventType: failureReason === 'account_disabled' ? 'account_disabled' : 'failed_login',
        outcome: 'failure',
        failureReason,
        intent,
        ctx,
      });
      throw new UnauthorizedException(
        'Invalid or expired Firebase authentication token',
      );
    }

    const { uid, email, name, picture } = decodedToken;
    const credentialType =
      (decodedToken as any)?.firebase?.sign_in_provider ?? 'unknown';

    if (!email) {
      await this.recordAuthEvent({
        eventType: 'failed_login',
        outcome: 'failure',
        failureReason: 'missing_email',
        firebaseUid: uid,
        credentialType,
        intent,
        ctx,
      });
      throw new UnauthorizedException(
        'Email is required from Firebase authentication',
      );
    }

    try {
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

      // A banned or suspended account must not be able to obtain a fresh
      // token, but the attempt itself is the most interesting row in the log,
      // so it is recorded before the rejection.
      if (user.status === 'banned' || user.status === 'suspended') {
        await this.recordAuthEvent({
          eventType: 'account_disabled',
          outcome: 'failure',
          failureReason: `account_${user.status}`,
          userId: user.id,
          firebaseUid: uid,
          email,
          credentialType,
          intent,
          ctx,
        });
        throw new ForbiddenException(
          user.status === 'banned'
            ? 'Your account has been banned. Contact support if you believe this is a mistake.'
            : 'Your account is suspended. Contact support if you believe this is a mistake.',
        );
      }

      // Send welcome email to new users (fire-and-forget)
      if (!existingUser) {
        const displayName = name || email.split('@')[0];
        this.emailService.sendWelcomeEmail(email, displayName).catch((err) => {
          this.logger.error(`Failed to send welcome email: ${(err as Error).message}`);
        });
      }

      const isSignup = !existingUser;
      const isRestore = !isSignup && intent === 'restore';

      // Generate JWT
      const accessToken = this.generateToken(user);

      await this.recordAuthEvent({
        eventType: isSignup ? 'signup' : isRestore ? 'session_restore' : 'login',
        outcome: 'success',
        userId: user.id,
        firebaseUid: uid,
        email,
        credentialType,
        intent,
        ctx,
      });

      return { accessToken, user };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        // Already recorded on the branch that raised it.
        throw error;
      }
      this.logger.error(
        `Firebase token verification failed: ${(error as Error).message}`,
      );
      await this.recordAuthEvent({
        eventType: 'failed_login',
        outcome: 'failure',
        failureReason: 'server_error',
        firebaseUid: uid,
        email,
        credentialType,
        intent,
        ctx,
      });
      throw new UnauthorizedException(
        'Invalid or expired Firebase authentication token',
      );
    }
  }

  /** Fire-and-forget wrapper so a logging failure can never break a login. */
  private async recordAuthEvent(
    input: Parameters<SecurityService['recordAuthEvent']>[0],
  ): Promise<void> {
    try {
      await this.securityService.recordAuthEvent(input);
    } catch (error) {
      this.logger.warn(`Could not record auth event: ${(error as Error).message}`);
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
    const accountAgeDays = user.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999; // default to passing if no createdAt

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
