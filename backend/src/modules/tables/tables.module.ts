import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './entities/table.entity';
import { TableAssignment, TableAssignmentSchema } from './entities/table-assignment.entity';
import { EventParticipation, EventParticipationSchema } from '../events/entities/event-participation.entity';
import { Match, MatchSchema } from '../matching/entities/match.entity';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: TableAssignment.name, schema: TableAssignmentSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
    UsersModule,
  ],
  providers: [TablesService],
  controllers: [TablesController],
  exports: [TablesService],
})
export class TablesModule {}
