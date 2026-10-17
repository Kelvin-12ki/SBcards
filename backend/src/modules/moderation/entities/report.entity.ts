import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

/** What the reporter pointed at. */
export const REPORT_TARGET_TYPES = ['message', 'user', 'conversation'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

/** Fixed vocabulary so the admin queue can filter by reason. */
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'scam',
  'impersonation',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

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
export class Report {
  /** Who filed the report. */
  @Prop({ required: true, index: true })
  reporterId!: string;

  @Prop({ type: String, enum: REPORT_TARGET_TYPES, required: true, index: true })
  targetType!: ReportTargetType;

  /** Id of the reported message / user / conversation. */
  @Prop({ required: true, index: true })
  targetId!: string;

  /**
   * The user the report is against, resolved server-side at creation time.
   * Storing it here rather than deriving it on every list keeps the queue
   * join a single lookup even when the target was a message or a thread.
   */
  @Prop({ index: true })
  targetOwnerId?: string;

  /** Conversation carrying the reported message; set for targetType 'message'. */
  @Prop({ index: true })
  conversationId?: string;

  @Prop({ type: String, enum: REPORT_REASONS, required: true, index: true })
  reason!: ReportReason;

  /** Optional free-text elaboration from the reporter. */
  @Prop()
  details?: string;

  @Prop({ type: String, enum: REPORT_STATUSES, default: 'open', index: true })
  status!: ReportStatus;

  /** Admin's note on how the report was dispositioned. Never shown to the reporter. */
  @Prop()
  resolutionNote?: string;

  /** Admin who last touched the report. */
  @Prop()
  handledBy?: string;

  @Prop()
  handledAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// The admin queue's default ordering.
ReportSchema.index({ status: 1, createdAt: -1 });
// One report per reporter per target while it is still outstanding.
ReportSchema.index({ reporterId: 1, targetId: 1 });
// "everything reported against this user", the moderation hot path.
ReportSchema.index({ targetOwnerId: 1, createdAt: -1 });
