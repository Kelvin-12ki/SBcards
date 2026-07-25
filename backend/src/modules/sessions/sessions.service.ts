import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './entities/session.entity';
import {
  SessionCheckin,
  SessionCheckinDocument,
} from './entities/session-checkin.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(SessionCheckin.name)
    private readonly checkinModel: Model<SessionCheckinDocument>,
  ) {}

  /**
   * Create a new session for an event.
   */
  async create(
    eventId: string,
    data: CreateSessionDto,
  ): Promise<SessionDocument> {
    return this.sessionModel.create({
      ...data,
      eventId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    });
  }

  /**
   * List all sessions for an event, sorted by startTime.
   */
  async findAllByEvent(eventId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ eventId })
      .sort({ startTime: 1 })
      .exec();
  }

  /**
   * Find a session by ID.
   */
  async findById(sessionId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException(
        `Session with ID "${sessionId}" not found`,
      );
    }
    return session;
  }

  /**
   * Update a session.
   */
  async update(
    sessionId: string,
    data: UpdateSessionDto,
  ): Promise<SessionDocument> {
    const updateData: any = { ...data };
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    const updated = await this.sessionModel
      .findByIdAndUpdate(sessionId, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `Session with ID "${sessionId}" not found`,
      );
    }

    return updated;
  }

  /**
   * Delete a session.
   */
  async remove(sessionId: string): Promise<void> {
    const session = await this.sessionModel.findByIdAndDelete(sessionId).exec();
    if (!session) {
      throw new NotFoundException(
        `Session with ID "${sessionId}" not found`,
      );
    }

    // Clean up related checkins
    await this.checkinModel.deleteMany({ sessionId }).exec();
  }

  /**
   * Check in a user to a session.
   */
  async checkin(
    sessionId: string,
    userId: string,
  ): Promise<SessionCheckinDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException(
        `Session with ID "${sessionId}" not found`,
      );
    }

    // Check for duplicate checkin
    const existing = await this.checkinModel
      .findOne({ sessionId, userId })
      .exec();
    if (existing) {
      throw new BadRequestException('User already checked into this session');
    }

    // Check capacity
    if (session.capacity && session.checkinCount >= session.capacity) {
      throw new BadRequestException('Session has reached maximum capacity');
    }

    // Create checkin record
    const checkin = await this.checkinModel.create({
      sessionId,
      userId,
    });

    // Increment checkin count
    await this.sessionModel
      .findByIdAndUpdate(sessionId, { $inc: { checkinCount: 1 } })
      .exec();

    this.logger.log(`User ${userId} checked into session ${sessionId}`);

    return checkin;
  }

  /**
   * Get all attendees (checked-in users) for a session.
   */
  async getAttendees(sessionId: string): Promise<SessionCheckinDocument[]> {
    return this.checkinModel.find({ sessionId }).sort({ checkedInAt: 1 }).exec();
  }

  /**
   * Get event schedule — all sessions grouped by date.
   */
  async getEventSchedule(eventId: string): Promise<
    { date: string; sessions: SessionDocument[] }[]
  > {
    const sessions = await this.sessionModel
      .find({ eventId })
      .sort({ startTime: 1 })
      .exec();

    const grouped: Map<string, SessionDocument[]> = new Map();

    for (const session of sessions) {
      const dateKey = session.startTime.toISOString().split('T')[0];
      const group = grouped.get(dateKey) || [];
      group.push(session);
      grouped.set(dateKey, group);
    }

    const schedule: { date: string; sessions: SessionDocument[] }[] = [];
    for (const [date, sessionList] of grouped.entries()) {
      schedule.push({ date, sessions: sessionList });
    }

    return schedule;
  }
}
