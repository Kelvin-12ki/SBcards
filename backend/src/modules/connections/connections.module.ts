import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Connection,
  ConnectionSchema,
} from './entities/connection.entity';
import {
  LeadQualification,
  LeadQualificationSchema,
} from './entities/lead-qualification.entity';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { UsersModule } from '../users/users.module';
import { CardsModule } from '../cards/cards.module';
import { TimelineModule } from '../timeline/timeline.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Connection.name, schema: ConnectionSchema },
      { name: LeadQualification.name, schema: LeadQualificationSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => CardsModule),
    TimelineModule,
    NotificationsModule,
  ],
  providers: [ConnectionsService],
  controllers: [ConnectionsController],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
