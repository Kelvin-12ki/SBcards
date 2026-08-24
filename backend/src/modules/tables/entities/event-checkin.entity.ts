import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventCheckInDocument = HydratedDocument<EventCheckIn>;

/**
 * Records that an attendee is physically present at an event.
 * This is the gate for Physical AI table assignment — only checked-in
 * users are placed at tables. Distinct from EventParticipation (which
 * means "joined this event with a card").
 */
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
export class EventCheckIn {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ default: () => new Date() })
  checkedInAt!: Date;

  // How the check-in happened: self QR scan, organizer manual, etc.
  @Prop({ enum: ['qr', 'manual', 'self'], default: 'qr' })
  method!: string;
}

export const EventCheckInSchema = SchemaFactory.createForClass(EventCheckIn);

// One check-in per user per event.
EventCheckInSchema.index({ eventId: 1, userId: 1 }, { unique: true });
