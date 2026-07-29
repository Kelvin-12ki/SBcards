import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import { Connection, ConnectionSchema } from '../connections/entities/connection.entity';
import { Event, EventSchema } from '../events/entities/event.entity';
import { EventParticipation, EventParticipationSchema } from '../events/entities/event-participation.entity';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
      { name: Connection.name, schema: ConnectionSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
    ]),
    UsersModule,
    EventsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
