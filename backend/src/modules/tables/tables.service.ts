import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './entities/table.entity';
import {
  TableAssignment,
  TableAssignmentDocument,
} from './entities/table-assignment.entity';
import {
  EventCheckIn,
  EventCheckInDocument,
} from './entities/event-checkin.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from '../events/entities/event-participation.entity';
import { Event, EventDocument } from '../events/entities/event.entity';
import { Match, MatchDocument } from '../matching/entities/match.entity';
import { MatchingService } from '../matching/matching.service';
import { UsersService } from '../users/users.service';
import { AssignTableDto } from './dto/assign-table.dto';
import { SetupTablesDto } from './dto/setup-tables.dto';
import { CheckInResultDto } from './dto/check-in.dto';
import { MyAssignmentDto, TablemateDto } from './dto/my-assignment.dto';

/** Internal shape of an assignable attendee (checked-in + has a card). */
interface EligibleAttendee {
  userId: string;
  participationId: string;
  cardId: string;
  skills: string[];
  interests: string[];
  industry: string;
  seniority: string;
}

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(TableAssignment.name)
    private readonly assignmentModel: Model<TableAssignmentDocument>,
    @InjectModel(EventCheckIn.name)
    private readonly checkInModel: Model<EventCheckInDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(Match.name)
    private readonly matchesModel: Model<MatchDocument>,
    private readonly matchingService: MatchingService,
    private readonly usersService: UsersService,
  ) {}

  // ────────────────────────────────────────────────────────────
  //  Table setup
  // ────────────────────────────────────────────────────────────

  /**
   * Organizer configures the table layout for an event. Persists the config
   * on the Event and (re)creates the concrete Table documents.
   */
  async setupTables(
    eventId: string,
    dto: SetupTablesDto,
  ): Promise<AssignTableDto[]> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    event.tableConfig = {
      enabled: true,
      seatsPerTable: dto.seatsPerTable,
      rotationIntervalMinutes: dto.rotationIntervalMinutes,
    };
    event.tables = Array.from({ length: dto.tableCount }, (_, i) => ({
      number: i + 1,
      seatCount: dto.seatsPerTable,
      label: `Table ${i + 1}`,
    }));
    event.tableCount = dto.tableCount;
    event.tableCapacity = dto.seatsPerTable;
    await event.save();

    await this.createTablesForEvent(eventId, dto.tableCount, dto.seatsPerTable);
    return this.getEventTables(eventId);
  }

  /** Create N tables for an event, replacing any existing ones. */
  async createTablesForEvent(
    eventId: string,
    count: number,
    capacity: number,
  ): Promise<TableDocument[]> {
    await this.tableModel.deleteMany({ eventId }).exec();
    const tables: TableDocument[] = [];
    for (let i = 1; i <= count; i++) {
      tables.push(
        await this.tableModel.create({
          eventId,
          tableNumber: i,
          label: `Table ${i}`,
          capacity,
          currentCount: 0,
        }),
      );
    }
    return tables;
  }

  // ────────────────────────────────────────────────────────────
  //  Check-in
  // ────────────────────────────────────────────────────────────

  /** Check a user in to an event (idempotent). */
  async checkIn(
    eventId: string,
    userId: string,
    method = 'qr',
  ): Promise<CheckInResultDto> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const checkIn = await this.checkInModel
      .findOneAndUpdate(
        { eventId, userId },
        { $setOnInsert: { eventId, userId, method, checkedInAt: new Date() } },
        { upsert: true, new: true },
      )
      .exec();

    const participation = await this.participationModel
      .findOne({ eventId, userId })
      .exec();

    return {
      id: checkIn.id,
      eventId,
      userId,
      checkedInAt: checkIn.checkedInAt,
      method: checkIn.method,
      hasCard: !!participation?.cardId,
    };
  }

  /** Check a user out (removes check-in and any current-round seat). */
  async checkOut(eventId: string, userId: string): Promise<void> {
    await this.checkInModel.deleteOne({ eventId, userId }).exec();
    const event = await this.eventModel.findById(eventId).exec();
    const round = event?.currentRotationRound ?? 0;
    await this.assignmentModel
      .deleteMany({ eventId, userId, rotationRound: round })
      .exec();
  }

  /** List all check-ins for an event with basic user info. */
  async listCheckIns(eventId: string): Promise<
    Array<{
      userId: string;
      userName: string;
      avatarUrl?: string;
      method: string;
      checkedInAt: Date;
      hasCard: boolean;
    }>
  > {
    const checkIns = await this.checkInModel
      .find({ eventId })
      .sort({ checkedInAt: 1 })
      .exec();
    if (checkIns.length === 0) return [];

    const userIds = checkIns.map((c) => c.userId);
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const participations = await this.participationModel
      .find({ eventId, userId: { $in: userIds } })
      .exec();
    const withCard = new Set(
      participations.filter((p) => p.cardId).map((p) => p.userId),
    );

    return checkIns.map((c) => {
      const u = userMap.get(c.userId);
      return {
        userId: c.userId,
        userName: u?.displayName || u?.email || 'Unknown',
        avatarUrl: u?.avatarUrl,
        method: c.method,
        checkedInAt: c.checkedInAt,
        hasCard: withCard.has(c.userId),
      };
    });
  }

  /** Checked-in attendees with full profile info (for organizer views). */
  async getAttendees(eventId: string): Promise<
    Array<{
      userId: string;
      userName: string;
      avatarUrl?: string;
      jobRole?: string;
      company?: string;
      industry?: string;
      seniority?: string;
      skills: string[];
      interests: string[];
      cardId: string;
      hasCard: boolean;
    }>
  > {
    const eligible = await this.getEligibleAttendees(eventId);
    const eligibleMap = new Map(eligible.map((e) => [e.userId, e]));

    const checkIns = await this.checkInModel.find({ eventId }).exec();
    const users = await this.usersService.findByIds(
      checkIns.map((c) => c.userId),
    );
    const userMap = new Map(users.map((u) => [u.id, u]));

    return checkIns.map((c) => {
      const u = userMap.get(c.userId);
      const e = eligibleMap.get(c.userId);
      return {
        userId: c.userId,
        userName: u?.displayName || u?.email || 'Unknown',
        avatarUrl: u?.avatarUrl,
        jobRole: u?.jobRole,
        company: u?.company,
        industry: u?.industry,
        seniority: u?.seniority,
        skills: u?.skills ?? [],
        interests: u?.interests ?? [],
        cardId: e?.cardId ?? '',
        hasCard: !!e,
      };
    });
  }

  // ────────────────────────────────────────────────────────────
  //  Assignment
  // ────────────────────────────────────────────────────────────

  /**
   * Run AI matching + diversity-aware table assignment for the current round.
   * Only checked-in users who have a card are seated.
   */
  async assignTables(eventId: string): Promise<AssignTableDto[]> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Ensure fresh matches exist for the event (over all participants).
    await this.matchingService.runMatching(eventId);

    const round = event.currentRotationRound ?? 0;
    return this.seatAttendees(event, round);
  }

  /**
   * Core seating routine for a given rotation round. Clears prior seats for
   * that round, then greedily fills tables maximizing diversity.
   */
  private async seatAttendees(
    event: EventDocument,
    round: number,
  ): Promise<AssignTableDto[]> {
    const eventId = event.id;
    const eligible = await this.getEligibleAttendees(eventId);

    // Ensure we have enough tables to seat everyone.
    const seatsPerTable = event.tableCapacity || 6;
    const neededTables = Math.max(
      event.tableCount || 1,
      Math.ceil(eligible.length / seatsPerTable) || 1,
    );

    let tables: TableDocument[] = await this.tableModel
      .find({ eventId })
      .sort({ tableNumber: 1 })
      .exec();
    if (tables.length < neededTables) {
      tables = await this.createTablesForEvent(
        eventId,
        neededTables,
        seatsPerTable,
      );
    }

    // Clear this round's assignments and reset counts.
    await this.assignmentModel
      .deleteMany({ eventId, rotationRound: round })
      .exec();
    for (const t of tables) {
      t.currentCount = 0;
    }

    if (eligible.length === 0) {
      await Promise.all(tables.map((t) => t.save()));
      return this.buildAssignTableDtos(eventId, tables, round);
    }

    // Build pairwise overlap scores from the Match collection.
    const scoreMap = await this.buildScoreMap(eventId);

    // Greedy: for each table, seed with the most "central" remaining person,
    // then fill seats with the best complement (skill/industry/seniority
    // diversity + some shared interest + conversation potential).
    const remaining = new Map(eligible.map((e) => [e.userId, e]));
    const avgScore = this.computeAverageScores(eligible, scoreMap);

    for (const table of tables) {
      if (remaining.size === 0) break;
      const seated: EligibleAttendee[] = [];
      const capacity = table.capacity || seatsPerTable;

      // Seed: highest average match score to the remaining pool.
      const seed = [...remaining.values()].sort(
        (a, b) => (avgScore.get(b.userId) ?? 0) - (avgScore.get(a.userId) ?? 0),
      )[0];
      seated.push(seed);
      remaining.delete(seed.userId);

      // Fill remaining seats by best complement to those already seated.
      while (seated.length < capacity && remaining.size > 0) {
        let best: EligibleAttendee | null = null;
        let bestScore = -Infinity;
        for (const cand of remaining.values()) {
          const s = this.complementScore(cand, seated, scoreMap);
          if (s > bestScore) {
            bestScore = s;
            best = cand;
          }
        }
        if (!best) break;
        seated.push(best);
        remaining.delete(best.userId);
      }

      // Persist the seats for this table.
      await Promise.all(
        seated.map((att, idx) =>
          this.assignmentModel.create({
            eventId,
            tableId: table.id,
            tableNumber: table.tableNumber,
            seatNumber: idx + 1,
            userId: att.userId,
            participationId: att.participationId,
            rotationRound: round,
          }),
        ),
      );
      table.currentCount = seated.length;
    }

    await Promise.all(tables.map((t) => t.save()));
    return this.buildAssignTableDtos(eventId, tables, round);
  }

  /**
   * How well a candidate complements the people already at a table.
   * Rewards skill/industry/seniority diversity and at least some shared
   * interest, with a small nudge from raw match overlap (conversation flow).
   */
  private complementScore(
    cand: EligibleAttendee,
    seated: EligibleAttendee[],
    scoreMap: Map<string, number>,
  ): number {
    const tableSkills = new Set(seated.flatMap((s) => s.skills));
    const tableIndustries = new Set(
      seated.map((s) => s.industry).filter(Boolean),
    );
    const seniorityCounts = new Map<string, number>();
    for (const s of seated) {
      if (s.seniority) {
        seniorityCounts.set(
          s.seniority,
          (seniorityCounts.get(s.seniority) ?? 0) + 1,
        );
      }
    }

    // Skill diversity: fraction of the candidate's skills that are new.
    const newSkills = cand.skills.filter((sk) => !tableSkills.has(sk)).length;
    const skillDiversity =
      cand.skills.length > 0 ? newSkills / cand.skills.length : 0.5;

    // Industry mixing: reward a not-yet-present industry.
    const industryDiversity =
      cand.industry && !tableIndustries.has(cand.industry) ? 1 : 0;

    // Seniority balance: reward under-represented seniority levels.
    const sameSeniority = cand.seniority
      ? (seniorityCounts.get(cand.seniority) ?? 0)
      : 0;
    const seniorityBalance = 1 / (1 + sameSeniority);

    // Some shared interest with at least one member aids conversation.
    const tableInterests = new Set(seated.flatMap((s) => s.interests));
    const sharedInterest = cand.interests.some((i) => tableInterests.has(i))
      ? 1
      : 0;

    // Conversation potential: average match overlap with seated members.
    const avgOverlap =
      seated.reduce(
        (sum, s) =>
          sum + (scoreMap.get(this.pairKey(cand.userId, s.userId)) ?? 0),
        0,
      ) / seated.length;

    return (
      skillDiversity * 3 +
      industryDiversity * 2 +
      seniorityBalance * 1.5 +
      sharedInterest * 1 +
      avgOverlap * 1
    );
  }

  private computeAverageScores(
    attendees: EligibleAttendee[],
    scoreMap: Map<string, number>,
  ): Map<string, number> {
    const result = new Map<string, number>();
    for (const a of attendees) {
      let sum = 0;
      for (const b of attendees) {
        if (a.userId === b.userId) continue;
        sum += scoreMap.get(this.pairKey(a.userId, b.userId)) ?? 0;
      }
      result.set(
        a.userId,
        attendees.length > 1 ? sum / (attendees.length - 1) : 0,
      );
    }
    return result;
  }

  /** Symmetric key for a pair of user ids. */
  private pairKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  private async buildScoreMap(eventId: string): Promise<Map<string, number>> {
    const matches = await this.matchesModel.find({ eventId }).exec();
    const map = new Map<string, number>();
    for (const m of matches) {
      map.set(this.pairKey(m.userAId, m.userBId), m.overlapScore);
    }
    return map;
  }

  /**
   * Checked-in users who also have an EventParticipation with a card.
   * This is the eligibility gate for seating.
   */
  private async getEligibleAttendees(
    eventId: string,
  ): Promise<EligibleAttendee[]> {
    const checkIns = await this.checkInModel.find({ eventId }).exec();
    if (checkIns.length === 0) return [];
    const checkedInIds = new Set(checkIns.map((c) => c.userId));

    const participations = await this.participationModel
      .find({ eventId, isVisible: true })
      .exec();
    const partMap = new Map(participations.map((p) => [p.userId, p]));

    const eligibleIds = [...checkedInIds].filter((id) => {
      const p = partMap.get(id);
      return p && p.cardId;
    });
    if (eligibleIds.length === 0) return [];

    const users = await this.usersService.findByIds(eligibleIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return eligibleIds.map((id) => {
      const p = partMap.get(id)!;
      const u = userMap.get(id);
      return {
        userId: id,
        participationId: p._id.toString(),
        cardId: p.cardId,
        skills: u?.skills ?? [],
        interests: u?.interests ?? [],
        industry: u?.industry ?? '',
        seniority: u?.seniority ?? '',
      };
    });
  }

  // ────────────────────────────────────────────────────────────
  //  Read models
  // ────────────────────────────────────────────────────────────

  /** The requesting user's table for the current round, with tablemates. */
  async getMyAssignment(
    eventId: string,
    userId: string,
  ): Promise<MyAssignmentDto | null> {
    const event = await this.eventModel.findById(eventId).exec();
    const round = event?.currentRotationRound ?? 0;

    const mine = await this.assignmentModel
      .findOne({ eventId, userId, rotationRound: round })
      .exec();
    if (!mine) return null;

    const table = await this.tableModel.findById(mine.tableId).exec();

    const seatmates = await this.assignmentModel
      .find({ eventId, tableId: mine.tableId, rotationRound: round })
      .sort({ seatNumber: 1 })
      .exec();
    const otherIds = seatmates
      .filter((s) => s.userId !== userId)
      .map((s) => s.userId);

    const users = await this.usersService.findByIds(otherIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Pull match rows involving the requester for scores + starters.
    const matches = await this.matchesModel
      .find({
        eventId,
        $or: [{ userAId: userId }, { userBId: userId }],
      })
      .exec();
    const matchMap = new Map<string, MatchDocument>();
    for (const m of matches) {
      const other = m.userAId === userId ? m.userBId : m.userAId;
      matchMap.set(other, m);
    }

    const participations = await this.participationModel
      .find({ eventId, userId: { $in: otherIds } })
      .exec();
    const cardMap = new Map(participations.map((p) => [p.userId, p.cardId]));

    const tablemates: TablemateDto[] = seatmates
      .filter((s) => s.userId !== userId)
      .map((s) => {
        const u = userMap.get(s.userId);
        const m = matchMap.get(s.userId);
        return {
          userId: s.userId,
          userName: u?.displayName || u?.email || 'Unknown',
          cardId: cardMap.get(s.userId) ?? '',
          seatNumber: s.seatNumber,
          avatarUrl: u?.avatarUrl,
          jobRole: u?.jobRole,
          company: u?.company,
          industry: u?.industry,
          overlapScore: m?.overlapScore ?? 0,
          sharedKeywords: m?.sharedKeywords ?? [],
          conversationStarters: m?.conversationStarters ?? [],
        };
      });

    return {
      tableId: mine.tableId,
      tableNumber: mine.tableNumber,
      label: table?.label,
      seatNumber: mine.seatNumber,
      rotationRound: round,
      tablemates,
    };
  }

  /**
   * Backwards-compatible simple view of a user's table (used by the older
   * GET /my-table route). Returns table + attendee list for the current round.
   */
  async getMyTable(
    eventId: string,
    userId: string,
  ): Promise<AssignTableDto | null> {
    const event = await this.eventModel.findById(eventId).exec();
    const round = event?.currentRotationRound ?? 0;

    const mine = await this.assignmentModel
      .findOne({ eventId, userId, rotationRound: round })
      .exec();
    if (!mine) return null;

    const table = await this.tableModel.findById(mine.tableId).exec();
    if (!table) return null;

    return (await this.buildAssignTableDtos(eventId, [table], round))[0];
  }

  /** List all tables for an event with their seated attendees (current round). */
  async getEventTables(eventId: string): Promise<AssignTableDto[]> {
    const event = await this.eventModel.findById(eventId).exec();
    const round = event?.currentRotationRound ?? 0;
    const tables = await this.tableModel
      .find({ eventId })
      .sort({ tableNumber: 1 })
      .exec();
    return this.buildAssignTableDtos(eventId, tables, round);
  }

  private async buildAssignTableDtos(
    eventId: string,
    tables: TableDocument[],
    round: number,
  ): Promise<AssignTableDto[]> {
    if (tables.length === 0) return [];

    const tableIds = tables.map((t) => t.id);
    const assignments = await this.assignmentModel
      .find({ eventId, tableId: { $in: tableIds }, rotationRound: round })
      .sort({ seatNumber: 1 })
      .exec();

    const userIds = [...new Set(assignments.map((a) => a.userId))];
    const users = await this.usersService.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const participations = await this.participationModel
      .find({ eventId, userId: { $in: userIds } })
      .exec();
    const cardMap = new Map(participations.map((p) => [p.userId, p.cardId]));

    return tables.map((table) => {
      const seated = assignments.filter((a) => a.tableId === table.id);
      return {
        tableId: table.id,
        tableNumber: table.tableNumber,
        label: table.label || undefined,
        attendees: seated.map((a) => {
          const u = userMap.get(a.userId);
          return {
            userId: a.userId,
            userName: u?.displayName || u?.email || 'Unknown',
            cardId: cardMap.get(a.userId) ?? '',
          };
        }),
      };
    });
  }
}
