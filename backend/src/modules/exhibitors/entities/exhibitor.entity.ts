import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExhibitorDocument = HydratedDocument<Exhibitor>;

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
export class Exhibitor {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  companyName!: string;

  @Prop()
  description?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  website?: string;

  @Prop({ type: [String], default: [] })
  products!: string[];

  @Prop({ type: [String], default: [] })
  services!: string[];

  @Prop({ type: [String], default: [] })
  teamMemberIds!: string[];

  @Prop()
  boothNumber?: string;

  @Prop()
  boothLocation?: string;

  @Prop({ default: 0 })
  visitorCount!: number;

  @Prop({ default: 0 })
  leadCount!: number;
}

export const ExhibitorSchema = SchemaFactory.createForClass(Exhibitor);

// Index for listing exhibitors by event
ExhibitorSchema.index({ eventId: 1, companyName: 1 });
