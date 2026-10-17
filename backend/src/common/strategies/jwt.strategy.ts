import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/users/entities/user.entity';

export interface JwtPayload {
  sub: string;       // MongoDB user ID
  uid: string;       // Firebase UID
  email: string;
  role: string;      // User role
}

export interface JwtUser {
  uid: string;       // Firebase UID (compatible with FirebaseUser interface)
  email: string;
  userId: string;    // MongoDB user ID
  role: string;      // Role as it was when the token was minted
  /** Current `status` from the DB, or undefined if the lookup did not run. */
  status?: string;
  /** Current `role` from the DB, or undefined if the lookup did not run. */
  dbRole?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Claims alone are trusted for identity, but `status` and `role` are re-read
   * from the DB so a ban, a promotion, or a demotion takes effect immediately
   * instead of whenever the 7-day token happens to expire.
   *
   * Fails open when the document is missing or the lookup errors: `/auth/me`
   * is responsible for re-creating a user document for a valid token, so
   * rejecting here would make that path unreachable. The status check itself
   * lives in JwtAuthGuard.handleRequest, which only fires on a successful
   * authentication.
   */
  async validate(payload: JwtPayload): Promise<JwtUser> {
    const base: JwtUser = {
      uid: payload.uid,
      email: payload.email,
      userId: payload.sub,
      role: payload.role,
    };

    try {
      const dbUser = await this.userModel
        .findOne({ firebaseUid: payload.uid })
        .select('status role')
        .lean();

      if (dbUser) {
        base.status = dbUser.status;
        base.dbRole = dbUser.role;
      }
    } catch (error) {
      this.logger.warn(
        `Could not refresh status for ${payload.uid}: ${(error as Error).message}`,
      );
    }

    return base;
  }
}
