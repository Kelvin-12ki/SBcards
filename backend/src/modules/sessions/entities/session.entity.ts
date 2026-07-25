import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

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
export class Session {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop()
  location?: string;

  @Prop()
  room?: string;

  @Prop({ type: [String], default: [] })
  speakerIds!: string[];

  @Prop({
    enum: ['talk', 'workshop', 'panel', 'break', 'networking'],
    default: 'talk',
  })
  type!: string;

  @Prop()
  capacity?: number;

  @Prop({ default: 0 })
  checkinCount!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Index for querying sessions by event sorted by startTime
SessionSchema.index({ eventId: 1, startTime: 1 });
