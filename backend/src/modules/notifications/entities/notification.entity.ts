import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

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
export class Notification {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;
  // 'new_connection', 'message', 'event_reminder', 'session_update', 'match_new', 'exhibitor_visit'

  @Prop({ required: true })
  title!: string;

  @Prop()
  body?: string;

  @Prop()
  link?: string; // deep link to relevant page

  @Prop({ default: false })
  read!: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for user's notification feed (newest first)
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Index for unread count queries
NotificationSchema.index({ userId: 1, read: 1 });
