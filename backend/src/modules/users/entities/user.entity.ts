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
}

export const UserSchema = SchemaFactory.createForClass(User);
