import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../events/entities/event.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from '../events/entities/event-participation.entity';
import {
  Match,
  MatchDocument,
} from '../matching/entities/match.entity';
import {
  Connection,
  ConnectionDocument,
} from '../connections/entities/connection.entity';
import {
  Session,
  SessionDocument,
} from '../sessions/entities/session.entity';
import {
  SessionCheckin,
  SessionCheckinDocument,
} from '../sessions/entities/session-checkin.entity';
import {
  Exhibitor,
  ExhibitorDocument,
} from '../exhibitors/entities/exhibitor.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(SessionCheckin.name)
    private readonly checkinModel: Model<SessionCheckinDocument>,
    @InjectModel(Exhibitor.name)
    private readonly exhibitorModel: Model<ExhibitorDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
  ) {}

  /**
   * Get comprehensive analytics for an event.
   */
  async getEventAnalytics(eventId: string): Promise<{
    totalAttendees: number;
    activeAttendees: number;
    connectionsMade: number;
    averageMatchScore: number;
    sessionAttendance: number;
    topIndustries: { industry: string; count: number }[];
    companiesRepresented: { company: string; count: number }[];
    connectionTimeline: { date: string; count: number }[];
    networkingHeatmap: { hour: number; count: number }[];
    exhibitorStats: {
      totalExhibitors: number;
      totalVisitors: number;
      totalLeads: number;
    };
  }> {
    // Verify event exists
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    // ── 1. Total attendees ─────────────────────────────────────
    const totalAttendees = await this.participationModel
      .countDocuments({ eventId })
      .exec();

    // ── 2. Active attendees (participants with cards) ──────────
    const participations = await this.participationModel
      .find({ eventId })
      .exec();
    const activeAttendees = participations.filter((p) => p.cardId).length;

    // ── 3. Connections made ────────────────────────────────────
    const connectionsMade = await this.connectionModel
      .countDocuments({ eventId })
      .exec();

    // ── 4. Average match score ─────────────────────────────────
    const matchAgg = await this.matchModel
      .aggregate([
        { $match: { eventId } },
        { $group: { _id: null, avgScore: { $avg: '$overlapScore' } } },
      ])
      .exec();
    const averageMatchScore =
      matchAgg.length > 0 ? Math.round(matchAgg[0].avgScore * 100) / 100 : 0;

    // ── 5. Session attendance (total checkins for this event) ──
    const eventSessions = await this.sessionModel
      .find({ eventId })
      .select('_id')
      .exec();
    const eventSessionIds = eventSessions.map((s) => s._id.toString());
    const sessionAttendance = eventSessionIds.length > 0
      ? await this.checkinModel
          .countDocuments({ sessionId: { $in: eventSessionIds } })
          .exec()
      : 0;

    // ── 6. Top industries (from users of participants) ─────────
    const participantUserIds = participations.map((p) => p.userId);
    const userObjectIds = participantUserIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const topIndustriesRaw = await this.userModel
      .aggregate([
        {
          $match: {
            _id: { $in: userObjectIds },
            industry: { $exists: true, $nin: [null, ''] },
          },
        },
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .exec();
    const topIndustries = topIndustriesRaw.map((item) => ({
      industry: item._id,
      count: item.count,
    }));

    // ── 7. Companies represented (from cards of participants) ──
    const participantCardIds = participations
      .filter((p) => p.cardId)
      .map((p) => p.cardId);
    const cardObjectIds = participantCardIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const companiesRaw = await this.cardModel
      .aggregate([
        {
          $match: {
            _id: { $in: cardObjectIds },
            company: { $exists: true, $nin: [null, ''] },
          },
        },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .exec();
    const companiesRepresented = companiesRaw.map((item) => ({
      company: item._id,
      count: item.count,
    }));

    // ── 8. Connection timeline (last 30 days) ──────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const connectionTimelineRaw = await this.connectionModel
      .aggregate([
        {
          $match: {
            eventId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    const connectionTimeline = connectionTimelineRaw.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    // ── 9. Networking heatmap (connections per hour of day) ────
    const heatmapRaw = await this.connectionModel
      .aggregate([
        {
          $match: {
            eventId,
            createdAt: { $exists: true },
          },
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    // Fill in all 24 hours
    const hourCounts = new Map<number, number>();
    for (let h = 0; h < 24; h++) {
      hourCounts.set(h, 0);
    }
    for (const item of heatmapRaw) {
      hourCounts.set(item._id, item.count);
    }
    const networkingHeatmap = Array.from(hourCounts.entries()).map(
      ([hour, count]) => ({ hour, count }),
    );

    // ── 10. Exhibitor stats ────────────────────────────────────
    const exhibitors = await this.exhibitorModel.find({ eventId }).exec();
    const totalExhibitors = exhibitors.length;
    const totalVisitors = exhibitors.reduce(
      (sum, e) => sum + e.visitorCount,
      0,
    );
    const totalLeads = exhibitors.reduce((sum, e) => sum + e.leadCount, 0);

    return {
      totalAttendees,
      activeAttendees,
      connectionsMade,
      averageMatchScore,
      sessionAttendance,
      topIndustries,
      companiesRepresented,
      connectionTimeline,
      networkingHeatmap,
      exhibitorStats: {
        totalExhibitors,
        totalVisitors,
        totalLeads,
      },
    };
  }
}
