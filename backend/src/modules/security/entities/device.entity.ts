import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

/**
 * A device belonging to a user, recorded when that user authenticates from it.
 *
 * Registration happens inside SecurityService.recordAuthEvent(), so a device
 * appears here the first time it produces an auth event with a resolvable
 * user — never before. One row per (user, device) with first/last seen.
 */
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
export class Device {
  @Prop({ required: true, index: true })
  userId!: string;

  /** Client-generated stable id sent as `x-device-id`. */
  @Prop({ required: true })
  deviceId!: string;

  @Prop()
  userAgent?: string;

  @Prop()
  os?: string;

  @Prop()
  browser?: string;

  @Prop()
  platform?: string;

  @Prop()
  fingerprint?: string;

  /** Most recent source IP seen for this device. */
  @Prop({ index: true })
  lastIp?: string;

  @Prop({ index: true })
  firstSeenAt!: Date;

  @Prop({ index: true })
  lastSeenAt!: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// The upsert key. Also enforces that a device row can never be duplicated
// for the same user.
DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
DeviceSchema.index({ lastSeenAt: -1 });
DeviceSchema.index({ userId: 1, lastSeenAt: -1 });
DeviceSchema.index({ os: 1 });
DeviceSchema.index({ browser: 1 });
