import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlockDocument = HydratedDocument<Block>;

/**
 * One direction of a block: `blockedById` can no longer be contacted by
 * `blockedUserId`, and vice versa — a block between two users suppresses
 * messaging and connection requests in both directions.
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret: any) {
      ret.id = ret._id?.toString() ?? ret.id;
      delete ret.__v;
      delete ret._id;
      return ret;
    },
  },
})
export class Block {
  /** The user who initiated the block. */
  @Prop({ required: true, index: true })
  blockedById!: string;

  /** The user being blocked. */
  @Prop({ required: true, index: true })
  blockedUserId!: string;

  /** Free-text note from the blocker; never shown to the blocked user. */
  @Prop()
  reason?: string;
}

export const BlockSchema = SchemaFactory.createForClass(Block);

// The upsert key — a block can never exist twice in the same direction.
BlockSchema.index({ blockedById: 1, blockedUserId: 1 }, { unique: true });
// "who blocked me" lookups, which is the direction every enforcement check runs.
BlockSchema.index({ blockedUserId: 1, createdAt: -1 });
