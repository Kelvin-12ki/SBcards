import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the organization ID
 * from the request parameters.
 *
 * Usage:
 * ```typescript
 * @Get(':id/members')
 * getMembers(@CurrentOrg() orgId: string) { ... }
 * ```
 */
export const CurrentOrg = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const orgId = request.params?.id;

    if (data && orgId) {
      return orgId[data];
    }

    return orgId;
  },
);
