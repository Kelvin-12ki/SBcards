import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './entities/session.entity';
import {
  SessionCheckin,
  SessionCheckinSchema,
} from './entities/session-checkin.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: SessionCheckin.name, schema: SessionCheckinSchema },
    ]),
    forwardRef(() => EventsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [SessionsService],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
