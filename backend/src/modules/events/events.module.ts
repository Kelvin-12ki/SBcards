import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './entities/event.entity';
import { EventParticipation, EventParticipationSchema } from './entities/event-participation.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ExternalEventsController } from './external-events.controller';
import { NairobiEventsScraperService } from './nairobi-events-scraper.service';
import { UsersModule } from '../users/users.module';
import { CardsModule } from '../cards/cards.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import {
  EventCheckIn,
  EventCheckInSchema,
} from '../tables/entities/event-checkin.entity';
import {
  TableAssignment,
  TableAssignmentSchema,
} from '../tables/entities/table-assignment.entity';
import { Match, MatchSchema } from '../matching/entities/match.entity';
import {
  Connection,
  ConnectionSchema,
} from '../connections/entities/connection.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
      // Read-only here: my-status reports check-in and seating state that
      // TablesModule owns. Registering the schema in two modules is fine;
      // writes still go through TablesService.
      { name: EventCheckIn.name, schema: EventCheckInSchema },
      { name: TableAssignment.name, schema: TableAssignmentSchema },
      { name: Match.name, schema: MatchSchema },
      // Read-only here too: the post-join suggestions screen only needs to know
      // which participants the caller already has a connection with. Creating,
      // accepting and declining connections still go through ConnectionsService.
      { name: Connection.name, schema: ConnectionSchema },
    ]),
    UsersModule,
    CardsModule,
  ],
  providers: [EventsService, NairobiEventsScraperService],
  controllers: [EventsController, ExternalEventsController],
  exports: [EventsService, NairobiEventsScraperService],
})
export class EventsModule {}
