import { SetMetadata } from '@nestjs/common';
import { Role } from '../interfaces/role.interface';

export const ROLES_KEY = 'roles';

/**
 * Custom decorator that attaches required roles to a route handler.
 * If no roles are specified, any authenticated user may access the route.
 *
 * Usage:
 * ```typescript
 * @Roles(Role.ORG_ADMIN)
 * @Patch(':id')
 * updateOrg() { ... }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
