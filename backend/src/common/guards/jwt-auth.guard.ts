import {
  Injectable,
  UnauthorizedException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    // Preserve an explicit HTTP error raised deeper in the pipeline (e.g. the
    // account-status rejection below) rather than flattening it to 401.
    if (err instanceof HttpException) {
      throw err;
    }

    // Always throw an HttpException (401) instead of raw errors
    // This prevents NestJS from returning a bare 500 for JWT validation failures
    if (err || !user) {
      const reason = info?.message || err?.message || 'Authentication required';
      this.logger.warn(`JWT auth failed: ${reason}`);
      throw new UnauthorizedException(`Invalid or expired token: ${reason}`);
    }

    // `status` was refreshed from the DB by JwtStrategy.validate(), so this
    // takes effect immediately rather than at token expiry. Returning a 401
    // (not 403) is deliberate: the frontend already treats 401 as "session is
    // over" and clears storage, which is exactly what a banned account needs.
    if (user.status === 'banned' || user.status === 'suspended') {
      this.logger.warn(
        `Blocked ${user.status} account ${user.uid} from ${user.userId}`,
      );
      throw new UnauthorizedException(
        user.status === 'banned'
          ? 'Your account has been banned. Contact support if you believe this is a mistake.'
          : 'Your account is suspended. Contact support if you believe this is a mistake.',
      );
    }

    return user;
  }
}
