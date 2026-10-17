import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Block, BlockDocument } from './entities/block.entity';

/** Direction of a block relative to the caller. */
export type BlockDirection = 'outgoing' | 'incoming';

@Injectable()
export class BlocksService {
  constructor(
    @InjectModel(Block.name)
    private readonly blockModel: Model<BlockDocument>,
  ) {}

  async block(blockedById: string, blockedUserId: string, reason?: string) {
    if (blockedById === blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const existing = await this.blockModel
      .findOne({ blockedById, blockedUserId })
      .exec();
    if (existing) {
      throw new ConflictException('This user is already blocked');
    }

    return this.blockModel.create({ blockedById, blockedUserId, reason });
  }

  async unblock(blockedById: string, blockedUserId: string): Promise<void> {
    const res = await this.blockModel
      .deleteOne({ blockedById, blockedUserId })
      .exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException('This user is not blocked');
    }
  }

  /** The user's outgoing blocks, newest first, enriched with profile fields. */
  async listMine(blockedById: string) {
    const rows = await this.blockModel
      .find({ blockedById })
      .sort({ createdAt: -1 })
      .lean();

    const ownerIds = Array.from(
      new Set(rows.map((r) => r.blockedUserId).filter((id) => this.isValidId(id))),
    );

    // Owners are looked up through the raw collection rather than UsersService
    // so this module stays free of feature dependencies and cycle risk.
    const owners = ownerIds.length
      ? await this.blockModel.db
          .collection('users')
          .find({ _id: { $in: ownerIds.map((id) => new Types.ObjectId(id)) } })
          .project({ email: 1, displayName: 1, avatarUrl: 1, status: 1 })
          .toArray()
      : [];

    const ownerById = new Map(owners.map((o: any) => [String(o._id), o]));

    return rows.map((row) => ({
      id: row._id?.toString(),
      userId: row.blockedUserId,
      reason: row.reason ?? null,
      createdAt: (row as any).createdAt ?? null,
      user: ownerById.get(row.blockedUserId) ?? null,
    }));
  }

  /**
   * Both directions of blocking between two users.
   *
   * Returns null when there is no block at all, otherwise which side started
   * it — `outgoing` means `a` blocked `b`.
   */
  async findBetween(a: string, b: string): Promise<BlockDirection | null> {
    if (!a || !b || a === b || !this.isValidId(a) || !this.isValidId(b)) {
      return null;
    }

    const rows = await this.blockModel
      .find({
        $or: [
          { blockedById: a, blockedUserId: b },
          { blockedById: b, blockedUserId: a },
        ],
      })
      .lean();

    if (rows.length === 0) return null;
    return rows.some((r) => r.blockedById === a) ? 'outgoing' : 'incoming';
  }

  /**
   * Throw unless the two users may interact.
   *
   * Both directions block the action: a block is not one-way, since allowing
   * the blocked user to keep reaching the blocker would defeat it.
   *
   * @param verb phrase used to build the error, e.g. "message" or "connect with"
   */
  async assertNotBlocked(a: string, b: string, verb = 'interact with'): Promise<void> {
    const direction = await this.findBetween(a, b);
    if (!direction) return;

    if (direction === 'outgoing') {
      throw new ForbiddenException(
        `You have blocked this user. Unblock them to ${verb} them.`,
      );
    }
    throw new ForbiddenException(`You cannot ${verb} this user.`);
  }

  /** Ids involved in a block with this user, in either direction. */
  async getBlockedIds(userId: string): Promise<Set<string>> {
    if (!userId || !this.isValidId(userId)) return new Set();

    const rows = await this.blockModel
      .find({ $or: [{ blockedById: userId }, { blockedUserId: userId }] })
      .lean();

    const ids = new Set<string>();
    for (const row of rows) {
      if (row.blockedById === userId) ids.add(row.blockedUserId);
      else ids.add(row.blockedById);
    }
    return ids;
  }

  private isValidId(id: string): boolean {
    return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }
}
