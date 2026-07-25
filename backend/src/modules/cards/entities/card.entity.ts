import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CardDocument = HydratedDocument<Card>;

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
export class Card {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop({ required: true })
  fullName!: string;

  @Prop()
  headline?: string;

  @Prop()
  company?: string;

  @Prop()
  role?: string;

  @Prop()
  bio?: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  website?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  twitterUrl?: string;

  @Prop({ default: 'classic' })
  theme!: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: [{ name: String, category: String }] })
  skills?: { name: string; category?: string }[];

  @Prop({ type: [{ name: String }] })
  interests?: { name: string }[];
}

export const CardSchema = SchemaFactory.createForClass(Card);
