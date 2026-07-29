import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No authenticated user found in request');
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== 'admin') {
      this.logger.warn(
        `User ${user.userId} with role "${user.role}" attempted to access admin route`,
      );
      throw new ForbiddenException(
        'Admin access required. You do not have the necessary permissions.',
      );
    }

    return true;
  }
}
