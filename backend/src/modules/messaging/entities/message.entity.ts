import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

/** Kinds of message a conversation can carry. */
export const MESSAGE_TYPES = ['text', 'image', 'card-share'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

/** Snapshot of a shared business card, denormalised onto the message. */
export interface SharedCardData {
  cardId: string;
  name: string;
  role?: string;
  company?: string;
  template?: string;
  avatarUrl?: string;
}

/** Emoji -> the user ids that reacted with it. */
export type MessageReactions = Record<string, string[]>;

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
export class Message {
  @Prop({ required: true, index: true })
  conversationId!: string;

  @Prop({ required: true })
  senderId!: string;

  /**
   * Required for text messages only. An image or shared card carries its
   * payload in mediaUrl / cardData and may have an empty body (or an optional
   * caption), so the requirement is conditional rather than unconditional.
   */
  @Prop({
    type: String,
    default: '',
    required: function (this: Message) {
      return (this.type ?? 'text') === 'text';
    },
  })
  content!: string;

  @Prop({ default: false })
  read!: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: String, enum: MESSAGE_TYPES, default: 'text', index: true })
  type!: MessageType;

  /** Firebase Storage download URL for `image` messages. */
  @Prop({ type: String, default: null })
  mediaUrl?: string | null;

  /** Card snapshot for `card-share` messages. */
  @Prop({ type: Object, default: null })
  cardData?: SharedCardData | null;

  /**
   * Emoji reactions, e.g. { "👍": ["userA"], "❤️": ["userB", "userC"] }.
   * A function default is used so every document gets its own object rather
   * than sharing one instance across the schema.
   */
  @Prop({ type: Object, default: () => ({}) })
  reactions!: MessageReactions;

  /** Marks client-side encrypted payloads; the server does not decrypt. */
  @Prop({ default: false })
  encrypted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for chronological fetching of messages per conversation
MessageSchema.index({ conversationId: 1, createdAt: 1 });

// Full-text index supporting message search.
MessageSchema.index({ content: 'text' });
