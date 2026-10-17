import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument, ReportStatus } from './entities/report.entity';
import {
  AdminAuditLog,
  AdminAuditLogDocument,
} from './entities/admin-audit-log.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query';
import { Message, MessageDocument } from '../messaging/entities/message.entity';
import {
  Conversation,
  ConversationDocument,
} from '../messaging/entities/conversation.entity';
import { User, UserDocument } from '../users/entities/user.entity';

/** How many messages either side of the reported one an admin may read. */
const CONTEXT_BEFORE = 15;
const CONTEXT_AFTER = 10;

export interface UserSummary {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  status?: string;
}

@Injectable()
export class ModerationService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(AdminAuditLog.name)
    private readonly auditModel: Model<AdminAuditLogDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * File a report.
   *
   * The target is resolved server-side: a message report inherits the
   * conversation the message actually belongs to, and the reported owner is
   * derived rather than trusted, so a crafted payload cannot point moderation
   * at one thread while reporting content in another.
   */
  async createReport(reporterId: string, dto: CreateReportDto) {
    if (!Types.ObjectId.isValid(dto.targetId)) {
      throw new NotFoundException('Reported item not found');
    }

    let targetOwnerId: string | undefined;
    let conversationId: string | undefined;

    if (dto.targetType === 'message') {
      const message = await this.messageModel.findById(dto.targetId).lean();
      if (!message) throw new NotFoundException('Reported message not found');
      targetOwnerId = message.senderId;
      conversationId = message.conversationId;
    } else if (dto.targetType === 'user') {
      if (dto.targetId === reporterId) {
        throw new BadRequestException('You cannot report yourself');
      }
      const user = await this.userModel
        .findById(dto.targetId)
        .select('_id')
        .lean();
      if (!user) throw new NotFoundException('Reported user not found');
      targetOwnerId = dto.targetId;
    } else {
      const conversation = await this.conversationModel
        .findById(dto.targetId)
        .lean();
      if (!conversation) throw new NotFoundException('Conversation not found');
      const others = (conversation.participantIds || []).filter(
        (id) => id !== reporterId,
      );
      targetOwnerId = others[0];
      // lean() documents carry no `id` virtual — the _id must be read directly.
      conversationId = String(conversation._id);
    }

    // One outstanding report per reporter per target: the queue would
    // otherwise fill with duplicates every time the button is pressed twice.
    const existing = await this.reportModel
      .findOne({
        reporterId,
        targetId: dto.targetId,
        status: { $in: ['open', 'reviewing'] },
      })
      .select('_id')
      .lean();
    if (existing) {
      throw new ConflictException('You have already reported this');
    }

    const created = await this.reportModel.create({
      reporterId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      targetOwnerId,
      conversationId,
      reason: dto.reason,
      details: dto.details,
      status: 'open',
    });

    const plain = created.toJSON();
    return {
      id: plain.id,
      targetType: plain.targetType,
      targetId: plain.targetId,
      reason: plain.reason,
      status: plain.status,
      createdAt: plain.createdAt,
    };
  }

  /** Paged, filtered queue with reporter and reported-owner display info. */
  async listReports(query: ListReportsQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.targetType = query.type;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.reportModel.countDocuments(filter),
    ]);

    const owners = await this.resolveUsers(
      items.map((r) => r.targetOwnerId).filter((id): id is string => !!id),
    );
    const reporters = await this.resolveUsers(
      items.map((r) => r.reporterId),
    );

    return {
      items: items.map((item) => ({
        ...item,
        targetOwner: item.targetOwnerId
          ? owners.get(item.targetOwnerId) || null
          : null,
        reporter: reporters.get(item.reporterId) || null,
      })),
      total,
      page,
      limit,
    };
  }

  /** Apply a disposition, recording who did it and when. */
  async updateReport(adminId: string, id: string, dto: UpdateReportDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Report not found');

    const report = await this.reportModel.findById(id);
    if (!report) throw new NotFoundException('Report not found');

    const from = report.status;
    report.status = dto.status as ReportStatus;
    report.resolutionNote = dto.resolutionNote ?? report.resolutionNote;
    report.handledBy = adminId;
    report.handledAt = new Date();
    await report.save();

    await this.audit({
      actorId: adminId,
      action: 'report.status_changed',
      targetType: 'report',
      targetId: id,
      meta: { from, to: report.status },
    });

    return report.toJSON();
  }

  /**
   * Message content around a reported message, for the moderation window.
   *
   * This is the only route on the API that lets an admin read a conversation
   * they are not a participant in, so every call is audited and the window is
   * deliberately small: enough to judge the message in context, not a copy of
   * the thread.
   */
  async readReportMessages(
    adminId: string,
    id: string,
    before?: string,
    limit = 25,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Report not found');

    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('Report not found');
    if (report.targetType !== 'message' || !report.conversationId) {
      throw new BadRequestException(
        'Message context is only available for message reports',
      );
    }

    const reported = await this.messageModel
      .findById(report.targetId)
      .lean();
    if (!reported) throw new NotFoundException('Reported message not found');

    if (before && Number.isNaN(Date.parse(before))) {
      throw new BadRequestException('`before` must be an ISO-8601 timestamp');
    }
    const cursor = before ? new Date(before) : reported.createdAt;

    const [previous, following] = await Promise.all([
      this.messageModel
        .find({
          conversationId: report.conversationId,
          createdAt: { $lte: cursor },
        })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 50))
        .lean(),
      this.messageModel
        .find({
          conversationId: report.conversationId,
          createdAt: { $gt: cursor },
        })
        .sort({ createdAt: 1 })
        .limit(CONTEXT_AFTER)
        .lean(),
    ]);

    const senders = await this.resolveUsers(
      [...previous, ...following].map((m) => m.senderId),
    );

    await this.audit({
      actorId: adminId,
      action: 'report.read_messages',
      targetType: 'report',
      targetId: id,
      meta: {
        conversationId: report.conversationId,
        messageCount: previous.length + following.length,
      },
    });

    return {
      reportedMessageId: report.targetId,
      // Reversed so the window reads oldest -> newest with the reported
      // message sitting where it actually fell in the conversation.
      messages: [...previous.reverse(), ...following].map((m) => ({
        ...m,
        sender: senders.get(m.senderId) || null,
      })),
    };
  }

  /**
   * Chat health snapshot for the admin overview: volumes, the 30-day daily
   * curve, who is sending the most, and which threads are hottest — plus the
   * open-report count so the queue can be reached from the same screen.
   */
  async chatsOverview(days = 30) {
    const window = Math.min(Math.max(days, 1), 90);
    const now = new Date();
    const since = new Date(now.getTime() - window * 24 * 60 * 60 * 1000);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recent, daily, topSenderRows, busiestRows, openReports] =
      await Promise.all([
        Promise.all([
          this.messageModel.countDocuments({ createdAt: { $gte: last7 } }),
          this.messageModel.countDocuments({
            createdAt: { $gte: prev7, $lt: last7 },
          }),
          this.messageModel.countDocuments({
            createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          }),
        ]),
      this.messageModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.messageModel
        .aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$senderId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .exec(),
      this.messageModel
        .aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$conversationId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .exec(),
      this.reportModel.countDocuments({ status: { $in: ['open', 'reviewing'] } }),
    ]);

    const [conversationCount, messageCount, userCount] = await Promise.all([
      this.conversationModel.countDocuments(),
      this.messageModel.countDocuments(),
      this.userModel.countDocuments(),
    ]);

    const [messages7d, messagesPrev7d, messages24h] = recent;

    const topSenders = await this.attachUsers(
      topSenderRows.map((row) => ({
        userId: row._id as string,
        messageCount: row.count as number,
      })),
      'userId',
    );

    const conversations = await this.conversationModel
      .find({
        _id: { $in: busiestRows.map((row) => new Types.ObjectId(row._id)) },
      })
      .lean();
    const byId = new Map(conversations.map((c) => [String(c._id), c]));
    const participantIds = [
      ...new Set(conversations.flatMap((c) => c.participantIds || [])),
    ];
    const participants = await this.resolveUsers(participantIds);

    const busiest = busiestRows
      .map((row) => {
        const conversation = byId.get(row._id);
        if (!conversation) return null;
        return {
          conversationId: row._id,
          messageCount: row.count as number,
          lastMessagePreview: conversation.lastMessagePreview || '',
          participants: (conversation.participantIds || [])
            .map((pid) => participants.get(pid) || { id: pid })
            .filter(Boolean),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const changePct =
      messagesPrev7d > 0
        ? Math.round(((messages7d - messagesPrev7d) / messagesPrev7d) * 100)
        : messages7d > 0
          ? 100
          : 0;

    return {
      totals: {
        conversations: conversationCount,
        messages: messageCount,
        users: userCount,
        openReports,
      },
      recent: { last24h: messages24h, last7d: messages7d, prev7d: messagesPrev7d, changePct },
      daily,
      topSenders,
      busiest,
      windowDays: window,
    };
  }

  /** Record a privileged action. Logging must never break the action itself. */
  private async audit(entry: {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.auditModel.create(entry);
    } catch {
      // Best-effort: moderation continues even if the log write fails.
    }
  }

  private async resolveUsers(ids: string[]): Promise<Map<string, UserSummary>> {
    const unique = [...new Set(ids.filter((id) => Types.ObjectId.isValid(id)))];
    if (unique.length === 0) return new Map();

    const rows = await this.userModel
      .find({ _id: { $in: unique } })
      .select('displayName email avatarUrl status')
      .lean();

    return new Map(
      rows.map((row) => [
        String(row._id),
        {
          id: String(row._id),
          displayName: row.displayName,
          email: row.email,
          avatarUrl: row.avatarUrl,
          status: row.status,
        },
      ]),
    );
  }

  private async attachUsers<T extends Record<string, unknown>>(
    rows: T[],
    key: keyof T & string,
  ): Promise<Array<T & { user: UserSummary | null }>> {
    const map = await this.resolveUsers(
      rows.map((row) => String(row[key])),
    );
    return rows.map((row) => ({
      ...row,
      user: map.get(String(row[key])) || null,
    }));
  }
}
