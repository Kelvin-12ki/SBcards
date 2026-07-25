import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationMembershipDocument = HydratedDocument<OrganizationMembership>;

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
export class OrganizationMembership {
  @Prop({ required: true, index: true })
  organizationId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, type: String })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  invitedBy?: string;

  @Prop({ default: () => new Date() })
  joinedAt!: Date;
}

export const OrganizationMembershipSchema =
  SchemaFactory.createForClass(OrganizationMembership);

// Compound unique index on organizationId + userId
OrganizationMembershipSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true },
);
