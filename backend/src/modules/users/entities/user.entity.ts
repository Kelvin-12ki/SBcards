import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

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
export class User {
  @Prop({ required: true, unique: true })
  firebaseUid!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop()
  displayName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  title?: string;

  @Prop()
  industry?: string;

  @Prop()
  company?: string;

  @Prop()
  jobRole?: string;

  @Prop({ enum: ['entry', 'mid', 'senior', 'executive'] })
  seniority?: string;

  @Prop({ type: [String] })
  lookingFor?: string[];

  @Prop({ type: [String] })
  offering?: string[];

  @Prop({ type: [String] })
  skills?: string[];

  @Prop({ type: [String] })
  interests?: string[];

  @Prop()
  bio?: string;

  @Prop()
  whatsapp?: string;

  @Prop()
  portfolioUrl?: string;

  @Prop({ type: [{ label: { type: String }, url: { type: String } }] })
  socialLinks?: { label: string; url: string }[];

  @Prop()
  location?: string;

  @Prop()
  timezone?: string;

  @Prop({ default: false })
  profileComplete!: boolean;

  /**
   * 'attendee' is the default for new signups. 'user' is the legacy value
   * carried by accounts created before roles existed and is treated as
   * equivalent to 'attendee' everywhere — it stays in the enum so those
   * documents still validate on save.
   */
  @Prop({
    enum: ['user', 'attendee', 'organizer', 'admin'],
    default: 'attendee',
  })
  role!: string;

  /** Standing application to be upgraded to the organizer role. */
  @Prop({ type: Object, default: null })
  organizerRequest?: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    company?: string;
    jobTitle?: string;
    reason?: string;
    requestedAt?: Date;
    reviewedAt?: Date;
  };

  @Prop({ enum: ['active', 'suspended', 'banned'], default: 'active' })
  status!: string;

  @Prop()
  fcmToken?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
