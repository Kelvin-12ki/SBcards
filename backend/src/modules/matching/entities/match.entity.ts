import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

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
export class Match {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  userAId!: string;

  @Prop({ required: true })
  userBId!: string;

  @Prop({ required: true })
  cardAId!: string;

  @Prop({ required: true })
  cardBId!: string;

  @Prop({ default: 0 })
  overlapScore!: number;

  @Prop({ type: [String], default: [] })
  sharedKeywords!: string[];

  @Prop({
    type: Object,
    default: {
      skillComplementarityScore: 0,
      industryRelevanceScore: 0,
      interestOverlapScore: 0,
      networkingGoalScore: 0,
      connectionStatusScore: 0,
    },
  })
  factors!: {
    skillComplementarityScore: number;
    industryRelevanceScore: number;
    interestOverlapScore: number;
    networkingGoalScore: number;
    connectionStatusScore: number;
  };

  @Prop({ type: [String], default: [] })
  explanation!: string[];

  @Prop({ type: [String], default: [] })
  conversationStarters!: string[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// Compound index on eventId, userAId, userBId
MatchSchema.index({ eventId: 1, userAId: 1, userBId: 1 }, { unique: true });
