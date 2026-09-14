import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

export type PlanTier = 'free' | 'pro' | 'organization';

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: ['free', 'pro', 'organization'], default: 'free', required: true })
  plan!: PlanTier;

  @Prop({ enum: ['active', 'trialing', 'past_due', 'canceled', 'none'], default: 'none' })
  status!: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  stripePriceId?: string;

  @Prop()
  currentPeriodStart?: Date;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop({ default: false })
  cancelAtPeriodEnd?: boolean;

  @Prop({ default: false })
  trialUsed?: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
