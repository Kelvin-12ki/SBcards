import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

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
export class Event {
  @Prop({ required: true })
  creatorId!: string;

  @Prop({ index: true })
  organizationId?: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ default: 'upcoming' })
  status!: string;

  @Prop()
  maxAttendees?: number;

  @Prop({ default: 5 })
  tableCount!: number;

  @Prop({ default: 6 })
  tableCapacity!: number;

  @Prop({ default: false })
  isActive!: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);
