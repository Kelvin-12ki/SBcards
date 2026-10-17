import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { Report, ReportSchema } from './entities/report.entity';
import {
  AdminAuditLog,
  AdminAuditLogSchema,
} from './entities/admin-audit-log.entity';
import { Message, MessageSchema } from '../messaging/entities/message.entity';
import {
  Conversation,
  ConversationSchema,
} from '../messaging/entities/conversation.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * Standalone on purpose: nothing else depends on it, and it reads the
 * messaging and user schemas directly rather than importing those modules,
 * so adding moderation can never introduce an import cycle.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService, AdminGuard],
  exports: [ModerationService],
})
export class ModerationModule {}
