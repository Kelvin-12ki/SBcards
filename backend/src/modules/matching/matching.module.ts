import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from './entities/match.entity';
import { EventParticipation, EventParticipationSchema } from '../events/entities/event-participation.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: Card.name, schema: CardSchema },
    ]),
    UsersModule,
    NotificationsModule,
  ],
  providers: [MatchingService],
  controllers: [MatchingController],
  exports: [MatchingService],
})
export class MatchingModule {}
