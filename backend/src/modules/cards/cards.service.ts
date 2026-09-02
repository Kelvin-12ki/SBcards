import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card, CardDocument } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import {
  Connection,
  ConnectionDocument,
} from '../connections/entities/connection.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Connection.name)
    private readonly connectionModel: Model<ConnectionDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  /**
   * Create a new digital business card with optional skills and interests.
   */
  async create(userId: string, createCardDto: CreateCardDto): Promise<CardDocument> {
    // If this card is set as default, unset any existing default cards for this user
    if (createCardDto.isDefault) {
      await this.unsetOtherDefaults(userId);
    }

    // Check if this is the user's first card
    const existingCardCount = await this.cardModel.countDocuments({ userId }).exec();

    const { skills, interests, ...cardData } = createCardDto;

    const card = await this.cardModel.create({
      ...cardData,
      userId,
      skills: skills || [],
      interests: interests || [],
    });

    // If this is the user's first card, send a thank you notification
    if (existingCardCount === 0) {
      const user = await this.usersService.findById(userId);
      const name = user?.displayName || 'there';

      this.notificationsService.create(
        userId,
        'card_shared',
        'Your card is ready!',
        `Great work, ${name}! Your digital business card is live. Share it at events to grow your network.`,
        `/cards/${card._id.toString()}`,
      ).catch(() => {});

      this.pushService.sendPush(
        userId,
        'Your card is ready!',
        `Great work, ${name}! Your digital business card is live. Share it at events to grow your network.`,
        { type: 'card_shared', id: card._id.toString(), cardId: card._id.toString() },
      ).catch(() => {});
    }

    return card;
  }

  /**
   * Get all cards for a user.
   */
  async findAll(userId: string): Promise<CardDocument[]> {
    return this.cardModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find a single card by ID.
   */
  async findById(id: string): Promise<CardDocument | null> {
    return this.cardModel.findById(id).exec();
  }

  /**
   * Update a card. Only the owner can update.
   * Uses findByIdAndUpdate to only set provided fields (avoids saving huge existing avatarUrl).
   */
  async update(
    id: string,
    userId: string,
    updateCardDto: UpdateCardDto,
  ): Promise<CardDocument> {
    const card = await this.findById(id);

    if (!card) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You can only update your own cards');
    }

    const { skills, interests, ...cardData } = updateCardDto;

    // If setting as default, unset other defaults
    if (cardData.isDefault) {
      await this.unsetOtherDefaults(userId, id);
    }

    // Build $set update — only include defined fields
    const updateFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(cardData)) {
      if (value !== undefined && value !== null) {
        updateFields[key] = value;
      }
    }

    // Build $set for skills/interests if provided
    if (skills !== undefined) {
      updateFields.skills = skills;
    }
    if (interests !== undefined) {
      updateFields.interests = interests;
    }

    if (Object.keys(updateFields).length === 0) {
      return card; // nothing to update
    }

    return this.cardModel
      .findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .exec();
  }

  /**
   * Delete a card. Only the owner can delete.
   * If the deleted card was the default, auto-assign another card as default.
   */
  async delete(id: string, userId: string): Promise<void> {
    const card = await this.findById(id);

    if (!card) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You can only delete your own cards');
    }

    const wasDefault = card.isDefault;

    await this.cardModel.findByIdAndDelete(id).exec();

    // If the deleted card was the default, promote the most recent remaining card
    if (wasDefault) {
      const nextCard = await this.cardModel
        .findOne({ userId, _id: { $ne: id } })
        .sort({ createdAt: -1 })
        .exec();

      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
        this.logger.log(
          `Default card was deleted; promoted card "${nextCard._id}" as new default for user "${userId}"`,
        );
      }
    }
  }

  /**
   * Set a card as the default for a user, unsetting any others.
   */
  async setDefault(id: string, userId: string): Promise<CardDocument> {
    const card = await this.findById(id);

    if (!card) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You can only set your own cards as default');
    }

    await this.unsetOtherDefaults(userId, id);

    card.isDefault = true;
    return card.save();
  }

  /**
   * Unset the default flag for all cards belonging to a user,
   * optionally excluding a specific card ID.
   */
  private async unsetOtherDefaults(
    userId: string,
    excludeCardId?: string,
  ): Promise<void> {
    const filter: any = { userId, isDefault: true };

    if (excludeCardId) {
      filter._id = { $ne: excludeCardId };
    }

    await this.cardModel.updateMany(filter, { isDefault: false }).exec();
  }

  /**
   * Get wallet cards — cards of accepted connections for a user.
   * Returns an array of { card, sender } objects.
   */
  async findWalletCards(userId: string): Promise<any[]> {
    // Find all accepted connections where user is either party
    const connections = await this.connectionModel
      .find({
        $or: [{ userId }, { connectedUserId: userId }],
        status: 'accepted',
      })
      .exec();

    // Extract the other user's ID from each connection
    const otherUserIds = connections.map((conn) =>
      conn.userId === userId ? conn.connectedUserId : conn.userId,
    );

    // Deduplicate
    const uniqueIds = [...new Set(otherUserIds)];

    // Fetch user profiles for the connected users
    const users = await this.usersService.findByIds(uniqueIds);

    const walletCards: any[] = [];

    for (const connectedUser of users) {
      // Find their default card, or fall back to the first card
      const cards = await this.cardModel
        .find({ userId: connectedUser.id })
        .sort({ isDefault: -1, createdAt: -1 })
        .limit(1)
        .exec();

      if (cards.length > 0) {
        walletCards.push({
          card: cards[0].toJSON(),
          sender: {
            id: connectedUser.id,
            displayName: connectedUser.displayName,
            email: connectedUser.email,
            avatarUrl: connectedUser.avatarUrl,
            title: connectedUser.title,
            company: connectedUser.company,
            bio: connectedUser.bio,
            industry: connectedUser.industry,
            jobRole: connectedUser.jobRole,
          },
        });
      }
    }

    return walletCards;
  }

  /**
   * Find a card by ID (no auth check) and return it with owner profile info.
   */
  async findPublicCard(id: string): Promise<{ card: any; owner: any } | null> {
    const card = await this.cardModel.findById(id).exec();

    if (!card) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    let owner = null;
    try {
      const user = await this.usersService.findById(card.userId);
      if (user) {
        owner = {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          title: user.title,
          company: user.company,
          bio: user.bio,
        };
      }
    } catch {
      // Owner may have been deleted
    }

    return { card: card.toJSON(), owner };
  }
}
