import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QrCodeScanDocument = HydratedDocument<QrCodeScan>;

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
export class QrCodeScan {
  @Prop({ required: true, index: true })
  scannerId!: string;

  @Prop({ required: true, index: true })
  scannedUserId!: string;

  @Prop()
  eventId?: string;

  @Prop()
  location?: string;
}

export const QrCodeScanSchema = SchemaFactory.createForClass(QrCodeScan);
