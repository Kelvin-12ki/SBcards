import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminAuditLogDocument = HydratedDocument<AdminAuditLog>;

/**
 * Append-only record of privileged moderation actions.
 *
 * Every time an admin reads message content outside their own conversations
 * or dispositions a report, a row lands here. The log is deliberately
 * write-only from the API's point of view: it exists so a later review can
 * answer "who read these messages, and when" without the log itself becoming
 * another surface to administer.
 *
 * `action` is a plain string rather than an enum so new verbs do not require a
 * schema migration; current callers use the ADMIN_AUDIT_ACTIONS values.
 */
@Schema({
  timestamps: { createdAt: true, updatedAt: false },
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
export class AdminAuditLog {
  /** Admin who performed the action. */
  @Prop({ required: true, index: true })
  actorId!: string;

  /** e.g. 'report.status_changed', 'report.read_messages'. */
  @Prop({ required: true, index: true })
  action!: string;

  /** What the action touched, e.g. 'report', 'user'. */
  @Prop({ required: true })
  targetType!: string;

  @Prop({ index: true })
  targetId?: string;

  /** Small structured context; never message bodies. */
  @Prop({ type: Object, default: () => ({}) })
  meta?: Record<string, unknown>;

  createdAt?: Date;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
