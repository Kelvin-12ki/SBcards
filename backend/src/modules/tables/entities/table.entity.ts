import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TableDocument = HydratedDocument<Table>;

@Schema({
  timestamps: false,
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
export class Table {
  @Prop({ required: true, index: true })
  eventId!: string;

  @Prop({ required: true })
  tableNumber!: number;

  @Prop()
  label?: string;

  @Prop({ default: 6 })
  capacity!: number;

  @Prop({ default: 0 })
  currentCount!: number;
}

export const TableSchema = SchemaFactory.createForClass(Table);

// Compound unique index on eventId + tableNumber
TableSchema.index({ eventId: 1, tableNumber: 1 }, { unique: true });
