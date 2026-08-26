import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { PresenceService } from './services/presence.service';
import { MessageUploadService } from './services/message-upload.service';
import { UsersModule } from '../users/users.module';
import { ConnectionsModule } from '../connections/connections.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),

    // The gateway verifies the handshake token itself — websocket upgrades do
    // not run the HTTP guards. Same secret and expiry as the auth module, read
    // from config rather than duplicated.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),

    // Chat images are held in memory and streamed straight to Firebase
    // Storage, so nothing is ever written to the container's disk.
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: MessageUploadService.maxFileSize, files: 1 },
    }),

    UsersModule,
    ConnectionsModule,
    NotificationsModule,
  ],
  providers: [
    MessagingService,
    MessagingGateway,
    PresenceService,
    MessageUploadService,
  ],
  controllers: [MessagingController],
  exports: [MessagingService, PresenceService],
})
export class MessagingModule {}
