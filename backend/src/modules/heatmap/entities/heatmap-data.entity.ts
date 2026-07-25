import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HeatmapDataDocument = HydratedDocument<HeatmapData>;

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
export class HeatmapData {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  hour!: number; // 0-23

  @Prop({ required: true })
  day!: number; // 0-6 (Sun-Sat)

  @Prop({ default: 0 })
  connectionCount!: number;

  @Prop({ default: 0 })
  messageCount!: number;

  @Prop({ default: 0 })
  checkinCount!: number;

  @Prop({ default: 0 })
  scanCount!: number;

  @Prop({ type: [{ location: { type: String }, density: { type: Number } }], default: [] })
  locationData!: { location: string; density: number }[];
}

export const HeatmapDataSchema = SchemaFactory.createForClass(HeatmapData);

// Compound unique index on eventId, hour, day
HeatmapDataSchema.index({ eventId: 1, hour: 1, day: 1 }, { unique: true });
