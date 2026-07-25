import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../interfaces/role.interface';
import { OrganizationsService } from '../../modules/organizations/organizations.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No authenticated user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Extract organization ID from route params
    const organizationId = request.params?.id;

    if (!organizationId) {
      this.logger.warn('No organization ID found in route params');
      throw new ForbiddenException('Organization ID is required');
    }

    try {
      const userRole = await this.organizationsService.getUserRole(
        organizationId,
        user.userId,
      );

      if (!userRole) {
        this.logger.warn(
          `User ${user.userId} is not a member of organization ${organizationId}`,
        );
        throw new ForbiddenException(
          'You are not a member of this organization',
        );
      }

      const hasRole = requiredRoles.some((role) => userRole === role);

      if (!hasRole) {
        this.logger.warn(
          `User ${user.userId} has role "${userRole}" but required: ${requiredRoles.join(', ')}`,
        );
        throw new ForbiddenException(
          `Insufficient permissions. Required role(s): ${requiredRoles.join(', ')}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Error checking user role: ${(error as Error).message}`,
      );
      throw new ForbiddenException('Unable to verify permissions');
    }
  }
}
