import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './entities/table.entity';
import {
  TableAssignment,
  TableAssignmentDocument,
} from './entities/table-assignment.entity';
import {
  EventParticipation,
  EventParticipationDocument,
} from '../events/entities/event-participation.entity';
import { Match, MatchDocument } from '../matching/entities/match.entity';
import { AssignTableDto } from './dto/assign-table.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
    @InjectModel(TableAssignment.name)
    private readonly assignmentModel: Model<TableAssignmentDocument>,
    @InjectModel(EventParticipation.name)
    private readonly participationModel: Model<EventParticipationDocument>,
    @InjectModel(Match.name)
    private readonly matchesModel: Model<MatchDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create N tables for an event.
   */
  async createTablesForEvent(
    eventId: string,
    count: number,
    capacity: number,
  ): Promise<TableDocument[]> {
    // Delete any existing tables for this event
    await this.tableModel.deleteMany({ eventId }).exec();

    const tables: TableDocument[] = [];

    for (let i = 1; i <= count; i++) {
      const table = await this.tableModel.create({
        eventId,
        tableNumber: i,
        label: `Table ${i}`,
        capacity,
        currentCount: 0,
      });
      tables.push(table);
    }

    return tables;
  }

  /**
   * Assign participants to tables using a greedy algorithm:
   * 1. Sort matches by score DESC
   * 2. Assign matched pairs to same table
   * 3. Fill remaining seats with unassigned participants round-robin
   */
  async assignTables(eventId: string): Promise<AssignTableDto[]> {
    // Get tables for this event
    let tables: TableDocument[] = await this.tableModel
      .find({ eventId })
      .sort({ tableNumber: 1 })
      .exec();

    // If no tables exist, create default ones
    if (tables.length === 0) {
      tables = await this.createTablesForEvent(eventId, 5, 6);
    }

    // Clear existing assignments for tables of this event
    const tableIds = tables.map((t) => t._id.toString());
    if (tableIds.length > 0) {
      await this.assignmentModel
        .deleteMany({ tableId: { $in: tableIds } })
        .exec();
    }

    // Reset current counts
    for (const table of tables) {
      table.currentCount = 0;
      await table.save();
    }

    // Get all visible participations
    const participations = await this.participationModel
      .find({ eventId, isVisible: true })
      .exec();

    if (participations.length === 0) {
      return [];
    }

    // Get matches sorted by score DESC
    const matches = await this.matchesModel
      .find({ eventId })
      .sort({ overlapScore: -1 })
      .exec();

    // Track assigned participation IDs
    const assignedParticipationIds = new Set<string>();
    const tableCapacities = tables.map((t) => t.capacity);
    const tableCurrentCounts = new Array(tables.length).fill(0);
    const tableAssignments: Map<number, string[]> = new Map();
    tables.forEach((t) => tableAssignments.set(t.tableNumber, []));

    // Phase 1: Assign matched pairs
    for (const match of matches) {
      // Find participations for both users
      const partA = participations.find(
        (p) => p.userId === match.userAId,
      );
      const partB = participations.find(
        (p) => p.userId === match.userBId,
      );

      if (!partA || !partB) continue;
      const partAId = partA._id.toString();
      const partBId = partB._id.toString();
      if (
        assignedParticipationIds.has(partAId) ||
        assignedParticipationIds.has(partBId)
      )
        continue;

      // Find a table with room for both
      for (let ti = 0; ti < tables.length; ti++) {
        if (
          tableCurrentCounts[ti] + 2 <=
          tableCapacities[ti]
        ) {
          // Assign both to this table
          await this.createAssignment(
            tables[ti]._id.toString(),
            partAId,
          );
          await this.createAssignment(
            tables[ti]._id.toString(),
            partBId,
          );
          assignedParticipationIds.add(partAId);
          assignedParticipationIds.add(partBId);
          tableCurrentCounts[ti] += 2;
          tableAssignments
            .get(tables[ti].tableNumber)!
            .push(partAId, partBId);
          break;
        }
      }
    }

    // Phase 2: Fill remaining seats round-robin
    const unassigned = participations.filter(
      (p) => !assignedParticipationIds.has(p._id.toString()),
    );

    let tableIndex = 0;
    for (const participation of unassigned) {
      const participationId = participation._id.toString();

      // Find next table with space
      let attempts = 0;
      while (
        tableCurrentCounts[tableIndex % tables.length] >=
          tableCapacities[tableIndex % tables.length] &&
        attempts < tables.length
      ) {
        tableIndex++;
        attempts++;
      }

      if (attempts >= tables.length) {
        break; // All tables are full
      }

      const ti = tableIndex % tables.length;
      await this.createAssignment(
        tables[ti]._id.toString(),
        participationId,
      );
      assignedParticipationIds.add(participationId);
      tableCurrentCounts[ti]++;
      tableAssignments
        .get(tables[ti].tableNumber)!
        .push(participationId);
      tableIndex++;
    }

    // Update current counts
    for (let ti = 0; ti < tables.length; ti++) {
      tables[ti].currentCount = tableCurrentCounts[ti];
      await tables[ti].save();
    }

    // Build response DTOs
    return this.buildAssignTableDtos(eventId, tables);
  }

  /**
   * Create a single table assignment.
   */
  private async createAssignment(
    tableId: string,
    participationId: string,
  ): Promise<void> {
    await this.assignmentModel.create({
      tableId,
      participationId,
    });
  }

  /**
   * Get the table and all assigned attendees for a user's participation.
   */
  async getMyTable(
    eventId: string,
    userId: string,
  ): Promise<AssignTableDto | null> {
    const participation = await this.participationModel
      .findOne({ eventId, userId })
      .exec();

    if (!participation) {
      return null;
    }

    const assignment = await this.assignmentModel
      .findOne({ participationId: participation._id.toString() })
      .exec();

    if (!assignment) {
      return null;
    }

    const table = await this.tableModel.findById(assignment.tableId).exec();

    if (!table) {
      return null;
    }

    // Get all assignments for this table
    const allAssignments = await this.assignmentModel
      .find({ tableId: table._id.toString() })
      .exec();

    const attendees = [];
    for (const a of allAssignments) {
      const part = await this.participationModel
        .findById(a.participationId)
        .exec();
      if (part) {
        const user = await this.usersService.findById(part.userId);
        attendees.push({
          userId: part.userId,
          userName:
            user?.displayName || user?.email || 'Unknown',
          cardId: part.cardId || '',
        });
      }
    }

    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      label: table.label || undefined,
      attendees,
    };
  }

  /**
   * List all tables for an event with attendee counts.
   */
  async getEventTables(eventId: string): Promise<AssignTableDto[]> {
    const tables = await this.tableModel
      .find({ eventId })
      .sort({ tableNumber: 1 })
      .exec();

    return this.buildAssignTableDtos(eventId, tables);
  }

  /**
   * Build AssignTableDto array from tables.
   */
  private async buildAssignTableDtos(
    eventId: string,
    tables: TableDocument[],
  ): Promise<AssignTableDto[]> {
    const result: AssignTableDto[] = [];

    for (const table of tables) {
      const assignments = await this.assignmentModel
        .find({ tableId: table._id.toString() })
        .exec();

      const attendees = [];
      for (const assignment of assignments) {
        const part = await this.participationModel
          .findById(assignment.participationId)
          .exec();
        if (part) {
          const user = await this.usersService.findById(part.userId);
          attendees.push({
            userId: part.userId,
            userName:
              user?.displayName || user?.email || 'Unknown',
            cardId: part.cardId || '',
          });
        }
      }

      result.push({
        tableId: table.id,
        tableNumber: table.tableNumber,
        label: table.label || undefined,
        attendees,
      });
    }

    return result;
  }
}
