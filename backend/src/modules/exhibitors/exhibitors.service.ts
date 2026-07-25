import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exhibitor, ExhibitorDocument } from './entities/exhibitor.entity';
import { CreateExhibitorDto } from './dto/create-exhibitor.dto';
import { UpdateExhibitorDto } from './dto/update-exhibitor.dto';

@Injectable()
export class ExhibitorsService {
  private readonly logger = new Logger(ExhibitorsService.name);

  constructor(
    @InjectModel(Exhibitor.name)
    private readonly exhibitorModel: Model<ExhibitorDocument>,
  ) {}

  /**
   * Create a new exhibitor for an event.
   */
  async create(
    eventId: string,
    data: CreateExhibitorDto,
  ): Promise<ExhibitorDocument> {
    return this.exhibitorModel.create({
      ...data,
      eventId,
    });
  }

  /**
   * List all exhibitors for an event.
   */
  async findAllByEvent(eventId: string): Promise<ExhibitorDocument[]> {
    return this.exhibitorModel.find({ eventId }).sort({ companyName: 1 }).exec();
  }

  /**
   * Find an exhibitor by ID.
   */
  async findById(exhibitorId: string): Promise<ExhibitorDocument> {
    const exhibitor = await this.exhibitorModel.findById(exhibitorId).exec();
    if (!exhibitor) {
      throw new NotFoundException(
        `Exhibitor with ID "${exhibitorId}" not found`,
      );
    }
    return exhibitor;
  }

  /**
   * Update an exhibitor.
   */
  async update(
    exhibitorId: string,
    data: UpdateExhibitorDto,
  ): Promise<ExhibitorDocument> {
    const updated = await this.exhibitorModel
      .findByIdAndUpdate(exhibitorId, { $set: data }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `Exhibitor with ID "${exhibitorId}" not found`,
      );
    }

    return updated;
  }

  /**
   * Delete an exhibitor.
   */
  async remove(exhibitorId: string): Promise<void> {
    const exhibitor = await this.exhibitorModel
      .findByIdAndDelete(exhibitorId)
      .exec();
    if (!exhibitor) {
      throw new NotFoundException(
        `Exhibitor with ID "${exhibitorId}" not found`,
      );
    }
  }

  /**
   * Record a visitor to an exhibitor's booth.
   */
  async recordVisit(exhibitorId: string): Promise<ExhibitorDocument> {
    const updated = await this.exhibitorModel
      .findByIdAndUpdate(
        exhibitorId,
        { $inc: { visitorCount: 1 } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `Exhibitor with ID "${exhibitorId}" not found`,
      );
    }

    return updated;
  }

  /**
   * Record a lead for an exhibitor.
   */
  async recordLead(exhibitorId: string): Promise<ExhibitorDocument> {
    const updated = await this.exhibitorModel
      .findByIdAndUpdate(
        exhibitorId,
        { $inc: { leadCount: 1 } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `Exhibitor with ID "${exhibitorId}" not found`,
      );
    }

    return updated;
  }
}
