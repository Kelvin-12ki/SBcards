import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user.
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(createUserDto);
  }

  /**
   * Find a user by their ID.
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find a user by their Firebase UID.
   */
  async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid }).exec();
  }

  /**
   * Find a user by email.
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Upsert a user based on Firebase UID.
   * If a user with the given firebaseUid exists, update their email/displayName.
   * Otherwise, create a new user.
   */
  async upsertFirebaseUser(
    firebaseUid: string,
    email: string,
    displayName?: string | null,
  ): Promise<UserDocument> {
    const updateData: Record<string, any> = { email };
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    return this.userModel
      .findOneAndUpdate(
        { firebaseUid },
        { $set: updateData },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Update a user's fields.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return updated;
  }

  /**
   * Update a user's profile fields (alias for update).
   */
  async updateProfile(
    id: string,
    data: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.update(id, data);
  }

  /**
   * Find multiple users by their IDs.
   */
  async findByIds(ids: string[]): Promise<UserDocument[]> {
    if (ids.length === 0) return [];
    const validIds = ids.filter((id) => {
      try { new Types.ObjectId(id); return true; } catch { return false; }
    });
    if (validIds.length === 0) return [];
    return this.userModel.find({ _id: { $in: validIds } }).exec();
  }

  /**
   * Search users by displayName, company, skills, or industry.
   * Returns matching users, sorted by relevance.
   */
  async search(query: string): Promise<UserDocument[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    return this.userModel
      .find({
        $or: [
          { displayName: regex },
          { company: regex },
          { skills: regex },
          { industry: regex },
          { jobRole: regex },
          { bio: regex },
          { location: regex },
        ],
      })
      .limit(20)
      .exec();
  }
}
