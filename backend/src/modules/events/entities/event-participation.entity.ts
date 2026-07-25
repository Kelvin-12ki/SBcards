import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventParticipationDocument = HydratedDocument<EventParticipation>;

@Schema({
  timestamps: false,
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
export class EventParticipation {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  cardId!: string;

  @Prop({ default: true })
  isVisible!: boolean;

  @Prop({ default: () => new Date() })
  joinedAt!: Date;
}

export const EventParticipationSchema = SchemaFactory.createForClass(EventParticipation);

// Compound unique index on eventId + userId
EventParticipationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
