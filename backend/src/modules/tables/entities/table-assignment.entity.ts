import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TableAssignmentDocument = HydratedDocument<TableAssignment>;

/**
 * One attendee's seat at one table for one rotation round.
 *
 * Denormalized (eventId + tableNumber + userId) so we can query a whole
 * round cheaply and support rotations. There is no unique constraint on
 * userId alone — a user has one assignment PER rotationRound, so rotations
 * simply add rows with an incremented round.
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
export class TableAssignment {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  tableId!: string;

  @Prop({ required: true })
  tableNumber!: number;

  @Prop({ required: true })
  seatNumber!: number;

  @Prop({ required: true, index: true })
  userId!: string;

  // Link back to the user's EventParticipation (for cardId lookup). Optional
  // because a check-in can precede participation in edge cases.
  @Prop()
  participationId?: string;

  @Prop({ default: 0, index: true })
  rotationRound!: number;

  @Prop({ default: () => new Date() })
  assignedAt!: Date;
}

export const TableAssignmentSchema = SchemaFactory.createForClass(TableAssignment);

// A user holds exactly one seat per event per rotation round.
TableAssignmentSchema.index(
  { eventId: 1, userId: 1, rotationRound: 1 },
  { unique: true },
);
