import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

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
export class Conversation {
  @Prop({ type: [String], required: true, index: true })
  participantIds!: string[];

  @Prop({ index: true })
  lastMessageAt?: Date;

  @Prop({ default: '' })
  lastMessagePreview?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// NOTE: We removed the compound unique index on participantIds here.
// MongoDB unique indexes on arrays enforce uniqueness per-element, not per-combination.
// Duplicate prevention is handled in MessagingService.findOrCreate() using findOneAndUpdate.
