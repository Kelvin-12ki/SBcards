import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { EmailService } from '../notifications/email.service';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
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
}
