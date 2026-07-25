import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InsightDocument = HydratedDocument<Insight>;

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
export class Insight {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;
  // Types: 'relationship_strength', 'networking_suggestion', 'follow_up_reminder',
  //        'common_connection', 'mutual_interest', 'profile_tip'

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: Object, default: {} })
  data!: Record<string, any>;

  @Prop({ default: false })
  dismissed!: boolean;
}

export const InsightSchema = SchemaFactory.createForClass(Insight);

// Compound index for fetching insights by user and type, sorted by newest
InsightSchema.index({ userId: 1, type: 1, createdAt: -1 });
