import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash } from 'crypto';
import { AuthEvent, AuthEventDocument } from './entities/auth-event.entity';
import { Device, DeviceDocument } from './entities/device.entity';
import { ListAuthEventsQueryDto } from './dto/list-auth-events.query';
import { ListDevicesQueryDto } from './dto/list-devices.query';
import { RequestContext } from '../../common/utils/request-context';
import { parseUserAgent } from '../../common/utils/user-agent';
import { User, UserDocument } from '../users/entities/user.entity';

export interface RecordAuthEventInput {
  eventType: AuthEvent['eventType'];
  outcome: AuthEvent['outcome'];
  userId?: string;
  firebaseUid?: string;
  email?: string;
  credentialType?: string;
  failureReason?: string;
  intent?: string;
  ctx?: RequestContext;
}

export interface PaginatedAuthEvents {
  data: AuthEventDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectModel(AuthEvent.name)
    private readonly authEventModel: Model<AuthEventDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Persist an authentication attempt.
   *
   * Never throws and never rejects: this is called on the login path, and a
   * logging failure must not be able to deny someone a valid session.
   */
  async recordAuthEvent(input: RecordAuthEventInput): Promise<void> {
    try {
      const { os, browser, platform } = parseUserAgent(input.ctx?.userAgent);
      const ua = input.ctx?.userAgent ?? '';
      const fingerprint = ua
        ? createHash('sha256')
            .update(`${ua}|${input.ctx?.deviceId ?? ''}`)
            .digest('hex')
            .slice(0, 32)
        : undefined;

      await this.authEventModel.create({
        eventType: input.eventType,
        outcome: input.outcome,
        userId: input.userId,
        firebaseUid: input.firebaseUid,
        email: input.email,
        credentialType: input.credentialType,
        failureReason: input.failureReason,
        intent: input.intent,
        ip: input.ctx?.ip,
        userAgent: ua || undefined,
        os,
        browser,
        platform,
        deviceId: input.ctx?.deviceId,
        fingerprint,
        stepUp: false,
      });

      await this.registerDevice(input.userId, input.ctx, {
        userAgent: ua || undefined,
        os,
        browser,
        platform,
        fingerprint,
      });
    } catch (error) {
      this.logger.warn(
        `Dropped auth event (${input.eventType}/${input.outcome}): ${(error as Error).message}`,
      );
    }
  }

  /**
   * Create or refresh the device row for (user, device).
   *
   * Only runs when both a resolvable user and a client-supplied device id are
   * present, so a device is never registered against an anonymous or unknown
   * account. Swallows its own errors: registration is a side effect and must
   * not be able to fail the auth event it accompanies.
   */
  private async registerDevice(
    userId: string | undefined,
    ctx: RequestContext | undefined,
    meta: {
      userAgent?: string;
      os?: string;
      browser?: string;
      platform?: string;
      fingerprint?: string;
    },
  ): Promise<void> {
    if (!userId || !ctx?.deviceId) return;

    try {
      const now = new Date();

      // Only defined fields are written: a UA we could not parse leaves the
      // value as undefined, and writing undefined over a previously parsed OS
      // would erase it.
      const set: Record<string, unknown> = { lastSeenAt: now };
      if (meta.userAgent) set.userAgent = meta.userAgent;
      if (meta.os) set.os = meta.os;
      if (meta.browser) set.browser = meta.browser;
      if (meta.platform) set.platform = meta.platform;
      if (meta.fingerprint) set.fingerprint = meta.fingerprint;
      if (ctx.ip) set.lastIp = ctx.ip;

      await this.deviceModel.updateOne(
        { userId, deviceId: ctx.deviceId },
        { $set: set, $setOnInsert: { firstSeenAt: now } },
        { upsert: true },
      );
    } catch (error) {
      this.logger.warn(
        `Could not register device for ${userId}: ${(error as Error).message}`,
      );
    }
  }

  async listDevices(query: ListDevicesQueryDto): Promise<{
    data: Array<DeviceDocument & { user: any }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const filter: Record<string, any> = {};
    if (query.userId) filter.userId = query.userId;
    if (query.os) filter.os = query.os;
    if (query.browser) filter.browser = query.browser;
    if (query.ip) filter.lastIp = query.ip;
    if (query.since) filter.lastSeenAt = { $gte: new Date(query.since) };

    const [total, rows] = await Promise.all([
      this.deviceModel.countDocuments(filter).exec(),
      this.deviceModel
        .find(filter)
        .sort({ lastSeenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);

    // Batch the owner lookup rather than one query per device row.
    const ownerIds = Array.from(
      new Set(
        rows
          .map((r) => r.userId)
          .filter((id) => id && Types.ObjectId.isValid(id)),
      ),
    );
    const owners = ownerIds.length
      ? await this.userModel
          .find({ _id: { $in: ownerIds } })
          .select('email displayName status role')
          .lean()
      : [];
    const ownerById = new Map(owners.map((o) => [String(o._id), o]));

    const data = rows.map((row) => ({
      ...(row.toObject() as any),
      user: ownerById.get(row.userId) ?? null,
    }));

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async listAuthEvents(query: ListAuthEventsQueryDto): Promise<PaginatedAuthEvents> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const filter = this.buildFilter(query);

    const [total, data] = await Promise.all([
      this.authEventModel.countDocuments(filter).exec(),
      this.authEventModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async authEventStats(): Promise<{
    last24h: { success: number; failure: number; total: number };
    byCredentialType: { _id: string; count: number }[];
    topFailureReasons: { _id: string; count: number }[];
    topIps: { _id: string; count: number }[];
    daily: { date: string; success: number; failure: number }[];
  }> {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const [last24h, byCredentialType, topFailureReasons, topIps, daily] =
      await Promise.all([
        this.authEventModel
          .aggregate<{ _id: string; count: number }>([
            { $match: { createdAt: { $gte: new Date(now - day) } } },
            { $group: { _id: '$outcome', count: { $sum: 1 } } },
          ])
          .exec(),
        this.authEventModel.aggregate<{ _id: string; count: number }>([
          { $match: { createdAt: { $gte: new Date(now - 7 * day) } } },
          { $group: { _id: '$credentialType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.authEventModel.aggregate<{ _id: string; count: number }>([
          { $match: { outcome: 'failure', createdAt: { $gte: new Date(now - 7 * day) } } },
          { $group: { _id: '$failureReason', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.authEventModel.aggregate<{ _id: string; count: number }>([
          { $match: { ip: { $exists: true }, createdAt: { $gte: new Date(now - 7 * day) } } },
          { $group: { _id: '$ip', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        this.authEventModel
          .aggregate<{ _id: { date: string; outcome: string }; count: number }>([
            { $match: { createdAt: { $gte: new Date(now - 7 * day) } } },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  outcome: '$outcome',
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.date': 1 } },
          ])
          .exec(),
      ]);

    const successCount = last24h.find((r) => r._id === 'success')?.count ?? 0;
    const failureCount = last24h.find((r) => r._id === 'failure')?.count ?? 0;

    const byDate = new Map<string, { success: number; failure: number }>();
    for (const row of daily) {
      const bucket = byDate.get(row._id.date) ?? { success: 0, failure: 0 };
      if (row._id.outcome === 'success') bucket.success = row.count;
      else bucket.failure = row.count;
      byDate.set(row._id.date, bucket);
    }

    return {
      last24h: {
        success: successCount,
        failure: failureCount,
        total: successCount + failureCount,
      },
      byCredentialType: byCredentialType.map((r) => ({
        _id: r._id ?? 'unknown',
        count: r.count,
      })),
      topFailureReasons: topFailureReasons.map((r) => ({
        _id: r._id ?? 'unknown',
        count: r.count,
      })),
      topIps: topIps.map((r) => ({ _id: r._id, count: r.count })),
      daily: Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, bucket]) => ({ date, ...bucket })),
    };
  }

  private buildFilter(query: ListAuthEventsQueryDto): Record<string, any> {
    const filter: Record<string, any> = {};

    if (query.outcome) filter.outcome = query.outcome;
    if (query.eventType) filter.eventType = query.eventType;
    if (query.credentialType) filter.credentialType = query.credentialType;
    if (query.userId) filter.userId = query.userId;
    if (query.email) filter.email = query.email;
    if (query.ip) filter.ip = query.ip;
    if (query.deviceId) filter.deviceId = query.deviceId;
    if (query.failureReason) filter.failureReason = query.failureReason;

    if (query.since || query.until) {
      filter.createdAt = {};
      if (query.since) filter.createdAt.$gte = new Date(query.since);
      if (query.until) filter.createdAt.$lte = new Date(query.until);
    }

    return filter;
  }
}
