import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No authenticated user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // JwtStrategy.validate() already re-read the role from the DB when it
    // resolved `status`, so admin routes normally cost no extra query here.
    // Fall back to a direct lookup for the (rare) case that lookup failed.
    let role = user.dbRole;
    if (typeof role === 'undefined') {
      const dbUser = await this.userModel
        .findOne({ firebaseUid: user.uid })
        .lean();
      role = dbUser?.role;
    }

    // Admin only. Organizers previously slipped through here, which handed
    // anyone with a self-approved organizer application the ability to ban
    // users, read every account, and delete events.
    if (role !== 'admin') {
      this.logger.warn(
        `User ${user.userId || user.uid} with role "${role ?? 'none'}" attempted to access admin route`,
      );
      throw new ForbiddenException(
        'Admin access required. You do not have the necessary permissions.',
      );
    }

    return true;
  }
}
