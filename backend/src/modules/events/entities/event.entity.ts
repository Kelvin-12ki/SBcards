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

  // ── Physical AI Matching: table layout ──
  // Configuration for physical table assignment. `enabled` gates the whole feature.
  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      seatsPerTable: { type: Number, default: 6 },
      rotationIntervalMinutes: { type: Number, required: false },
    },
    default: { enabled: false, seatsPerTable: 6 },
  })
  tableConfig!: {
    enabled: boolean;
    seatsPerTable: number;
    rotationIntervalMinutes?: number;
  };

  // Concrete table layout, generated from tableConfig when the organizer runs setup.
  @Prop({
    type: [
      {
        number: { type: Number, required: true },
        seatCount: { type: Number, required: true },
        label: { type: String, required: false },
      },
    ],
    default: [],
  })
  tables!: { number: number; seatCount: number; label?: string }[];

  // Current rotation round for physical matching (0 = not yet assigned).
  @Prop({ default: 0 })
  currentRotationRound!: number;

  @Prop({ default: false })
  isActive!: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);
