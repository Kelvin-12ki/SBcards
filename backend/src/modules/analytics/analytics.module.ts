import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from '../events/entities/event.entity';
import {
  EventParticipation,
  EventParticipationSchema,
} from '../events/entities/event-participation.entity';
import { Match, MatchSchema } from '../matching/entities/match.entity';
import {
  Connection,
  ConnectionSchema,
} from '../connections/entities/connection.entity';
import { Session, SessionSchema } from '../sessions/entities/session.entity';
import {
  SessionCheckin,
  SessionCheckinSchema,
} from '../sessions/entities/session-checkin.entity';
import {
  Exhibitor,
  ExhibitorSchema,
} from '../exhibitors/entities/exhibitor.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { EventsModule } from '../events/events.module';
import { MatchingModule } from '../matching/matching.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ExhibitorsModule } from '../exhibitors/exhibitors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Connection.name, schema: ConnectionSchema },
      { name: Session.name, schema: SessionSchema },
      { name: SessionCheckin.name, schema: SessionCheckinSchema },
      { name: Exhibitor.name, schema: ExhibitorSchema },
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
    ]),
    forwardRef(() => EventsModule),
    forwardRef(() => MatchingModule),
    forwardRef(() => SessionsModule),
    forwardRef(() => ExhibitorsModule),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
