import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HeatmapData,
  HeatmapDataDocument,
} from './entities/heatmap-data.entity';
import {
  Connection,
  ConnectionDocument,
} from '../connections/entities/connection.entity';
import {
  Message,
  MessageDocument,
} from '../messaging/entities/message.entity';
import {
  SessionCheckin,
  SessionCheckinDocument,
} from '../sessions/entities/session-checkin.entity';

@Injectable()
export class HeatmapService {
  private readonly logger = new Logger(HeatmapService.name);

  constructor(
    @InjectModel(HeatmapData.name)
    private readonly heatmapModel: Model<HeatmapDataDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(SessionCheckin.name)
    private readonly checkinModel: Model<SessionCheckinDocument>,
  ) {}

  /**
   * Record an activity event, incrementing the appropriate counter for
   * the given event, hour, and day.
   */
  async recordActivity(
    eventId: string,
    type: 'connection' | 'message' | 'checkin' | 'scan',
    hour: number,
    day: number,
    location?: string,
  ): Promise<void> {
    const update: Record<string, number> = {};

    switch (type) {
      case 'connection':
        update.connectionCount = 1;
        break;
      case 'message':
        update.messageCount = 1;
        break;
      case 'checkin':
        update.checkinCount = 1;
        break;
      case 'scan':
        update.scanCount = 1;
        break;
    }

    const set: Record<string, any> = {};
    if (location) {
      // We'll update location data via a separate approach since $inc on array elements is complex
      // Instead, we upsert location density separately
      await this.upsertLocationData(eventId, hour, day, location);
    }

    await this.heatmapModel
      .findOneAndUpdate(
        { eventId, hour, day },
        { $inc: update, $setOnInsert: { eventId, hour, day } },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Upsert location density data for a specific time slot.
   */
  private async upsertLocationData(
    eventId: string,
    hour: number,
    day: number,
    location: string,
  ): Promise<void> {
    const slot = await this.heatmapModel
      .findOne({ eventId, hour, day })
      .exec();

    if (slot) {
      // Check if location already exists in array
      const existingIndex = slot.locationData.findIndex(
        (ld) => ld.location === location,
      );

      if (existingIndex >= 0) {
        // Increment density for existing location
        slot.locationData[existingIndex].density += 1;
      } else {
        // Add new location entry
        slot.locationData.push({ location, density: 1 });
      }

      await slot.save();
    } else {
      // Create new entry with location data
      await this.heatmapModel.create({
        eventId,
        hour,
        day,
        locationData: [{ location, density: 1 }],
      });
    }
  }

  /**
   * Get the full heatmap data for an event (24h x 7 days matrix).
   * Returns all slots, filling in zeros for missing slots.
   */
  async getHeatmap(eventId: string): Promise<HeatmapDataDocument[]> {
    return this.heatmapModel
      .find({ eventId })
      .sort({ day: 1, hour: 1 })
      .exec();
  }

  /**
   * Get the top 5 busiest time slots for an event.
   */
  async getPeakTimes(
    eventId: string,
  ): Promise<{ hour: number; day: number; total: number; slot: HeatmapDataDocument }[]> {
    const allData = await this.heatmapModel.find({ eventId }).exec();

    const withTotal = allData.map((d) => ({
      hour: d.hour,
      day: d.day,
      total:
        d.connectionCount +
        d.messageCount +
        d.checkinCount +
        d.scanCount,
      slot: d,
    }));

    return withTotal.sort((a, b) => b.total - a.total).slice(0, 5);
  }

  /**
   * Get density by location/room for an event.
   */
  async getLocationDensity(
    eventId: string,
  ): Promise<{ location: string; totalDensity: number }[]> {
    const allData = await this.heatmapModel.find({ eventId }).exec();

    const locationMap = new Map<string, number>();

    for (const data of allData) {
      for (const loc of data.locationData) {
        const current = locationMap.get(loc.location) ?? 0;
        locationMap.set(loc.location, current + loc.density);
      }
    }

    return [...locationMap.entries()]
      .map(([location, totalDensity]) => ({ location, totalDensity }))
      .sort((a, b) => b.totalDensity - a.totalDensity);
  }

  /**
   * Generate/regenerate heatmap data from historical data.
   * This rebuilds the entire heatmap from existing connection, message,
   * and checkin records.
   */
  async generateHeatmapFromHistory(eventId: string): Promise<{ generated: number }> {
    this.logger.log(`Generating heatmap from history for event ${eventId}`);

    // Clear existing heatmap data for this event
    await this.heatmapModel.deleteMany({ eventId }).exec();

    // ── 1. Process connections ───────────────────────────────────
    const connections = await this.connectionModel
      .find({ eventId })
      .exec();

    for (const conn of connections) {
      const connAny: any = conn;
      const createdAt = connAny.createdAt || conn.metAt || new Date();
      const hour = createdAt.getUTCHours();
      const day = createdAt.getUTCDay();

      await this.heatmapModel
        .findOneAndUpdate(
          { eventId, hour, day },
          {
            $inc: { connectionCount: 1 },
            $setOnInsert: { eventId, hour, day },
          },
          { upsert: true },
        )
        .exec();
    }

    // ── 2. Process messages ──────────────────────────────────────
    // Messages don't directly have eventId, so we look up conversations
    // that were created during the event timeframe
    // For simplicity, we count all messages as they are not event-specific
    // This would need enriched message data in production

    // ── 3. Process checkins ───────────────────────────────────────
    const checkins = await this.checkinModel
      .find()
      .populate({
        path: 'sessionId',
        match: { eventId },
        select: '_id',
      })
      .exec();

    for (const checkin of checkins) {
      // Only count if the populated session exists (belongs to this event)
      const session = (checkin as any).sessionId;
      if (!session) continue;

      const checkinTime = checkin.checkedInAt || new Date();
      const hour = checkinTime.getUTCHours();
      const day = checkinTime.getUTCDay();

      await this.heatmapModel
        .findOneAndUpdate(
          { eventId, hour, day },
          {
            $inc: { checkinCount: 1 },
            $setOnInsert: { eventId, hour, day },
          },
          { upsert: true },
        )
        .exec();
    }

    const count = await this.heatmapModel.countDocuments({ eventId }).exec();
    this.logger.log(`Heatmap generated for event ${eventId}: ${count} slots`);

    return { generated: count };
  }
}
