/**
 * Request metadata captured for security event logging.
 *
 * `trust proxy` is set in main.ts, so `req.ip` is already the real client IP
 * behind Render's proxy rather than the load balancer's address.
 */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
  /** Client-supplied stable id, sent as `x-device-id`. */
  deviceId?: string;
}

export function getRequestContext(req: any): RequestContext {
  const ip =
    Array.isArray(req?.ips) && req.ips.length > 0
      ? req.ips[0]
      : (req?.ip ?? req?.socket?.remoteAddress ?? undefined);

  const userAgent = req?.headers?.['user-agent'];
  const deviceId = req?.headers?.['x-device-id'];

  return {
    ip: typeof ip === 'string' && ip ? ip : undefined,
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
    deviceId:
      typeof deviceId === 'string' && deviceId.length <= 64
        ? deviceId
        : undefined,
  };
}
