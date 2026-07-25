import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

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
export class Activity {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  action!: string;
  // e.g. 'connected', 'joined_event', 'scanned_card', 'checked_in_session', 'uploaded_card'

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata!: Record<string, any>;
  // metadata examples:
  // - connected: { connectionId, targetUserName, targetUserAvatar }
  // - joined_event: { eventId, eventName }
  // - scanned_card: { cardId, cardName }
  // - checked_in_session: { sessionId, sessionTitle, eventName }
  // - uploaded_card: { cardId, cardTitle }

  @Prop({ default: false })
  public!: boolean; // public to org vs private
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Index for feed queries: user's activities sorted by creation time (newest first)
ActivitySchema.index({ userId: 1, createdAt: -1 });

// Index for event feed queries
ActivitySchema.index({ 'metadata.eventId': 1, createdAt: -1 });
