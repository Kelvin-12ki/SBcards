import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConnectionDocument = HydratedDocument<Connection>;

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
export class Connection {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  connectedUserId!: string;

  @Prop()
  connectedCardId?: string;

  @Prop()
  eventId?: string;

  @Prop({
    enum: ['pending', 'accepted', 'declined', 'archived'],
    default: 'pending',
  })
  status!: string;

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: false })
  isFavorite!: boolean;

  @Prop({
    enum: ['qr_scan', 'manual', 'event_match', 'import', 'profile'],
    default: 'qr_scan',
  })
  source!: string;

  @Prop()
  metAt?: Date;

  @Prop()
  followUpDate?: Date;

  @Prop()
  followUpNote?: string;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);

// Compound unique index to prevent duplicate connections
ConnectionSchema.index({ userId: 1, connectedUserId: 1 }, { unique: true });
