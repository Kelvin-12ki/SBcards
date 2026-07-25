import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './entities/event.entity';
import { EventParticipation, EventParticipationSchema } from './entities/event-participation.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { UsersModule } from '../users/users.module';
import { CardsModule } from '../cards/cards.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
    ]),
    UsersModule,
    CardsModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}
