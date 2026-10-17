import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuthEventDocument = HydratedDocument<AuthEvent>;

export type AuthEventType =
  | 'login'
  | 'signup'
  | 'session_restore'
  | 'failed_login'
  | 'rate_limited'
  | 'account_disabled';

export type AuthOutcome = 'success' | 'failure';

/**
 * One row per authentication attempt that reaches the API.
 *
 * Retention is 180 days via a TTL index — this is by far the highest-churn
 * collection in the security module and the cluster is on a small tier.
 */
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
export class AuthEvent {
  /** Mongo user id. Absent when the attempt failed before a user was resolved. */
  @Prop({ index: true })
  userId?: string;

  @Prop()
  firebaseUid?: string;

  @Prop({ index: true })
  email?: string;

  @Prop({ required: true, index: true })
  eventType!: AuthEventType;

  @Prop({ required: true, index: true })
  outcome!: AuthOutcome;

  @Prop({ index: true })
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  os?: string;

  @Prop()
  browser?: string;

  @Prop()
  platform?: string;

  /** Stable id generated once by the client and sent as `x-device-id`. */
  @Prop({ index: true })
  deviceId?: string;

  /** sha256 of the User-Agent + device id — used to correlate UA-only clients. */
  @Prop()
  fingerprint?: string;

  /**
   * Firebase's `sign_in_provider`: `password`, `google.com`, etc.
   * Stored raw so a new provider needs no migration.
   */
  @Prop({ index: true })
  credentialType?: string;

  /** Sanctioned failure code, e.g. token_expired, missing_email, throttled. */
  @Prop({ index: true })
  failureReason?: string;

  /** Client-supplied intent: login, register, restore, google. */
  @Prop()
  intent?: string;

  /**
   * Reserved for step-up verification. SBcards has no MFA today, so this is
   * always false — kept in the schema so adding MFA needs no migration.
   */
  @Prop({ default: false })
  stepUp!: boolean;

  /**
   * Reserved for phone auth. SBcards is email/Google only today, so this is
   * never populated.
   */
  @Prop()
  phone?: string;
}

export const AuthEventSchema = SchemaFactory.createForClass(AuthEvent);

// Retention: 180 days. `timestamps: true` supplies createdAt.
AuthEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

// Dashboard filters — each is a documented query parameter on /admin/security/auth-events.
AuthEventSchema.index({ outcome: 1, createdAt: -1 });
AuthEventSchema.index({ eventType: 1, createdAt: -1 });
AuthEventSchema.index({ userId: 1, createdAt: -1 });
AuthEventSchema.index({ email: 1, createdAt: -1 });
AuthEventSchema.index({ ip: 1, createdAt: -1 });
AuthEventSchema.index({ deviceId: 1, createdAt: -1 });
AuthEventSchema.index({ credentialType: 1, createdAt: -1 });
