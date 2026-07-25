import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionCheckinDocument = HydratedDocument<SessionCheckin>;

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
export class SessionCheckin {
  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ default: Date.now })
  checkedInAt!: Date;
}

export const SessionCheckinSchema = SchemaFactory.createForClass(SessionCheckin);

// Compound unique index to prevent duplicate checkins
SessionCheckinSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
