import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Insight, InsightSchema } from './entities/insight.entity';
import { Connection, ConnectionSchema } from '../connections/entities/connection.entity';
import { Match, MatchSchema } from '../matching/entities/match.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import { EventParticipation, EventParticipationSchema } from '../events/entities/event-participation.entity';
import { Conversation, ConversationSchema } from '../messaging/entities/conversation.entity';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Insight.name, schema: InsightSchema },
      { name: Connection.name, schema: ConnectionSchema },
      { name: Match.name, schema: MatchSchema },
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [InsightsService],
  controllers: [InsightsController],
  exports: [InsightsService],
})
export class InsightsModule {}
