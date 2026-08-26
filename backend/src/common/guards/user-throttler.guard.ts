import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
} from '@nestjs/throttler';

/**
 * Rate limits per authenticated user, falling back to IP for anonymous calls.
 *
 * Plain IP tracking is wrong for this product: at a physical networking event
 * every attendee is behind the venue's single NAT address, so an IP-keyed
 * bucket would throttle the whole room as one client.
 *
 * The bearer token is verified here rather than read blindly — this guard runs
 * as a global APP_GUARD, i.e. before the route-level JwtAuthGuard has populated
 * `req.user`, and an unverified `sub` claim would let a caller mint a fresh
 * bucket per request and evade the limit entirely.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = this.resolveUserId(req);
    if (userId) {
      return `user:${userId}`;
    }

    const ip =
      Array.isArray(req?.ips) && req.ips.length > 0
        ? req.ips[0]
        : (req?.ip ?? req?.socket?.remoteAddress ?? 'unknown');

    return `ip:${ip}`;
  }

  private resolveUserId(req: Record<string, any>): string | null {
    // Already authenticated (route-level guard ran first on some paths).
    if (req?.user?.userId) {
      return String(req.user.userId);
    }

    const header = req?.headers?.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return null;
    }

    try {
      const payload = this.jwtService.verify(header.slice(7).trim());
      return payload?.sub ? String(payload.sub) : null;
    } catch {
      // Expired, forged, or malformed — treat as anonymous and fall back to IP.
      return null;
    }
  }
}
