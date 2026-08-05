import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeadQualificationDocument = HydratedDocument<LeadQualification>;

@Schema({ timestamps: true, collection: 'lead_qualifications' })
export class LeadQualification {
  _id?: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  connectionId!: string;

  @Prop({ enum: ['none', 'hot', 'warm', 'cold'], default: 'none' })
  leadScore!: string;

  @Prop({ enum: ['not_started', 'in_progress', 'completed', 'no_follow_up'], default: 'not_started' })
  followUpStatus!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({
    type: [{
      _id: { type: Types.ObjectId, auto: true },
      text: { type: String, required: true },
      createdBy: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  privateNotes!: Array<{
    _id: Types.ObjectId;
    text: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export const LeadQualificationSchema = SchemaFactory.createForClass(LeadQualification);
LeadQualificationSchema.index({ userId: 1, connectionId: 1 }, { unique: true });
