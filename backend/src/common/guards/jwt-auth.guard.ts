import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    // Always throw an HttpException (401) instead of raw errors
    // This prevents NestJS from returning a bare 500 for JWT validation failures
    if (err || !user) {
      const reason = info?.message || err?.message || 'Authentication required';
      this.logger.warn(`JWT auth failed: ${reason}`);
      throw new UnauthorizedException(`Invalid or expired token: ${reason}`);
    }
    return user;
  }
}
