import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HeatmapData,
  HeatmapDataSchema,
} from './entities/heatmap-data.entity';
import {
  Connection,
  ConnectionSchema,
} from '../connections/entities/connection.entity';
import {
  Message,
  MessageSchema,
} from '../messaging/entities/message.entity';
import {
  SessionCheckin,
  SessionCheckinSchema,
} from '../sessions/entities/session-checkin.entity';
import { HeatmapService } from './heatmap.service';
import { HeatmapController } from './heatmap.controller';
import { MessagingModule } from '../messaging/messaging.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeatmapData.name, schema: HeatmapDataSchema },
      { name: Connection.name, schema: ConnectionSchema },
      { name: Message.name, schema: MessageSchema },
      { name: SessionCheckin.name, schema: SessionCheckinSchema },
    ]),
    forwardRef(() => MessagingModule),
    forwardRef(() => SessionsModule),
  ],
  providers: [HeatmapService],
  controllers: [HeatmapController],
  exports: [HeatmapService],
})
export class HeatmapModule {}
