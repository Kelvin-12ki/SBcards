import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the authenticated user
 * from the request object.
 *
 * Usage:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: FirebaseUser) {
 *   return user;
 * }
 * ```
 *
 * With property:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser('email') email: string) {
 *   return email;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a property name is specified, return that property
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
