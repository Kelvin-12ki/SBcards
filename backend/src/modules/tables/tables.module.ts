import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './entities/table.entity';
import {
  TableAssignment,
  TableAssignmentSchema,
} from './entities/table-assignment.entity';
import {
  EventCheckIn,
  EventCheckInSchema,
} from './entities/event-checkin.entity';
import {
  EventParticipation,
  EventParticipationSchema,
} from '../events/entities/event-participation.entity';
import { Event, EventSchema } from '../events/entities/event.entity';
import { Match, MatchSchema } from '../matching/entities/match.entity';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { UsersModule } from '../users/users.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: TableAssignment.name, schema: TableAssignmentSchema },
      { name: EventCheckIn.name, schema: EventCheckInSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: Event.name, schema: EventSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
    UsersModule,
    MatchingModule,
  ],
  providers: [TablesService],
  controllers: [TablesController],
  exports: [TablesService],
})
export class TablesModule {}
