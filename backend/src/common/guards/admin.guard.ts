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

    // Check DB for current role (JWT may be stale)
    const dbUser = await this.userModel.findOne({ firebaseUid: user.uid }).lean();
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'organizer')) {
      this.logger.warn(
        `User ${user.userId || user.uid} with role "${dbUser?.role || 'none'}" attempted to access admin route`,
      );
      throw new ForbiddenException(
        'Admin access required. You do not have the necessary permissions.',
      );
    }

    return true;
  }
}
