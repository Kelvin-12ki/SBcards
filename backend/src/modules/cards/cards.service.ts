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

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
  ) {}

  /**
   * Create a new digital business card with optional skills and interests.
   */
  async create(userId: string, createCardDto: CreateCardDto): Promise<CardDocument> {
    // If this card is set as default, unset any existing default cards for this user
    if (createCardDto.isDefault) {
      await this.unsetOtherDefaults(userId);
    }

    const { skills, interests, ...cardData } = createCardDto;

    return this.cardModel.create({
      ...cardData,
      userId,
      skills: skills || [],
      interests: interests || [],
    });
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
   * If skills/interests are provided, they are replaced entirely.
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

    // Update card fields
    Object.assign(card, cardData);

    // Replace skills if provided
    if (skills !== undefined) {
      card.skills = skills;
    }

    // Replace interests if provided
    if (interests !== undefined) {
      card.interests = interests;
    }

    return card.save();
  }

  /**
   * Delete a card. Only the owner can delete.
   */
  async delete(id: string, userId: string): Promise<void> {
    const card = await this.findById(id);

    if (!card) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You can only delete your own cards');
    }

    await this.cardModel.findByIdAndDelete(id).exec();
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
}
