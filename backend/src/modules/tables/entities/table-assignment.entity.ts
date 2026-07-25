import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TableAssignmentDocument = HydratedDocument<TableAssignment>;

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
export class TableAssignment {
  @Prop({ required: true })
  tableId!: string;

  @Prop({ required: true, unique: true })
  participationId!: string;

  @Prop({ default: () => new Date() })
  assignedAt!: Date;
}

export const TableAssignmentSchema = SchemaFactory.createForClass(TableAssignment);
