import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './entities/event.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from './entities/event-participation.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { Card, CardDocument } from '../cards/entities/card.entity';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
  ) {}

  /**
   * Create a new event.
   */
  async create(
    userId: string,
    createEventDto: CreateEventDto,
  ): Promise<EventDocument> {
    return this.eventModel.create({
      ...createEventDto,
      creatorId: userId,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
    });
  }

  /**
   * List events with optional status filter.
   */
  async findAll(
    status?: 'upcoming' | 'active' | 'completed',
  ): Promise<EventDocument[]> {
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    return this.eventModel.find(filter).sort({ startDate: 1 }).exec();
  }

  /**
   * Find event by ID with participant count.
   */
  async findById(id: string): Promise<(EventDocument & { participantCount?: number }) | null> {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      return null;
    }

    // Attach participant count
    const participantCount = await this.participationModel
      .countDocuments({ eventId: id })
      .exec();

    return Object.assign(event, { participantCount });
  }

  /**
   * Update an event. Only the creator can update.
   */
  async update(
    id: string,
    userId: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the event creator can update this event',
      );
    }

    const updateData: any = { ...updateEventDto };

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    Object.assign(event, updateData);
    return event.save();
  }

  /**
   * Delete an event. Only the creator can delete.
   */
  async delete(id: string, userId: string): Promise<void> {
    const event = await this.eventModel.findById(id).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    if (event.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the event creator can delete this event',
      );
    }

    await this.eventModel.findByIdAndDelete(id).exec();
  }

  /**
   * Join an event.
   */
  async join(
    eventId: string,
    userId: string,
    cardId: string,
  ): Promise<EventParticipationDocument> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    // Check if already participating
    const existing = await this.participationModel
      .findOne({ eventId, userId })
      .exec();

    if (existing) {
      throw new BadRequestException('Already participating in this event');
    }

    // Check max attendees limit
    if (event.maxAttendees) {
      const currentCount = await this.participationModel
        .countDocuments({ eventId })
        .exec();
      if (currentCount >= event.maxAttendees) {
        throw new BadRequestException(
          'Event has reached maximum attendees',
        );
      }
    }

    return this.participationModel.create({
      eventId,
      userId,
      cardId,
      isVisible: true,
    });
  }

  /**
   * Leave an event.
   */
  async leave(eventId: string, userId: string): Promise<void> {
    const participation = await this.participationModel
      .findOne({ eventId, userId })
      .exec();

    if (!participation) {
      throw new NotFoundException(
        'You are not participating in this event',
      );
    }

    await this.participationModel.findByIdAndDelete(participation._id).exec();
  }

  /**
   * Toggle visibility of a participant.
   */
  async toggleVisibility(
    eventId: string,
    userId: string,
  ): Promise<EventParticipationDocument> {
    const participation = await this.participationModel
      .findOne({ eventId, userId })
      .exec();

    if (!participation) {
      throw new NotFoundException(
        'You are not participating in this event',
      );
    }

    participation.isVisible = !participation.isVisible;
    return participation.save();
  }

  /**
   * Check if a user is participating in an event (regardless of visibility).
   */
  async checkParticipation(
    eventId: string,
    userId: string,
  ): Promise<EventParticipationDocument | null> {
    return this.participationModel.findOne({ eventId, userId }).exec();
  }

  /**
   * Get visible attendees with their cards.
   */
  async getAttendees(
    eventId: string,
  ): Promise<EventParticipationDocument[]> {
    return this.participationModel
      .find({ eventId, isVisible: true })
      .sort({ joinedAt: 1 })
      .exec();
  }

  /**
   * Get participants with full user and card details (creator only).
   */
  async getParticipantsWithDetails(
    eventId: string,
    requesterUserId: string,
  ): Promise<
    {
      id: string;
      userId: string;
      cardId: string;
      isVisible: boolean;
      joinedAt: string;
      user: {
        id: string;
        displayName?: string;
        email: string;
        avatarUrl?: string;
      } | null;
      card: {
        id: string;
        fullName: string;
        headline?: string;
        company?: string;
        role?: string;
        email?: string;
        avatarUrl?: string;
      } | null;
    }[]
  > {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    if (event.creatorId !== requesterUserId) {
      throw new ForbiddenException(
        'Only the event creator can view participant details',
      );
    }

    const participations = await this.participationModel
      .find({ eventId })
      .sort({ joinedAt: 1 })
      .exec();

    const results = await Promise.all(
      participations.map(async (p) => {
        const userDoc = await this.userModel.findById(p.userId).exec();
        const cardDoc = await this.cardModel.findById(p.cardId).exec();

        return {
          id: p._id?.toString() ?? p.id,
          userId: p.userId,
          cardId: p.cardId,
          isVisible: p.isVisible,
          joinedAt: p.joinedAt?.toISOString?.() ?? p.joinedAt,
          user: userDoc
            ? {
                id: userDoc._id?.toString() ?? userDoc.id,
                displayName: userDoc.displayName,
                email: userDoc.email,
                avatarUrl: userDoc.avatarUrl,
              }
            : null,
          card: cardDoc
            ? {
                id: cardDoc._id?.toString() ?? cardDoc.id,
                fullName: cardDoc.fullName,
                headline: cardDoc.headline,
                company: cardDoc.company,
                role: cardDoc.role,
                email: cardDoc.email,
                avatarUrl: cardDoc.avatarUrl,
              }
            : null,
        };
      }),
    );

    return results;
  }

  /**
   * Activate an event: set isActive=true, status='active'.
   */
  async activate(eventId: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(eventId).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    event.isActive = true;
    event.status = 'active';

    return event.save();
  }
}
