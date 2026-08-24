import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { AssignTableDto } from './dto/assign-table.dto';
import { SetupTablesDto } from './dto/setup-tables.dto';
import { CheckInDto, CheckInResultDto } from './dto/check-in.dto';
import { MyAssignmentDto } from './dto/my-assignment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@ApiTags('tables')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly usersService: UsersService,
  ) {}

  /** Resolve the authenticated caller's MongoDB user id. */
  private async resolveUserId(jwtUser: JwtUser): Promise<string> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.id;
  }

  // ── Table setup ──

  @Patch('events/:eventId/tables')
  @ApiOperation({ summary: 'Configure the table layout (organizer)' })
  async setupTables(
    @Param('eventId') eventId: string,
    @Body() dto: SetupTablesDto,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto[]> {
    await this.tablesService.assertOrganizer(
      eventId,
      await this.resolveUserId(jwtUser),
    );
    return this.tablesService.setupTables(eventId, dto);
  }

  @Get('events/:eventId/tables')
  @ApiOperation({ summary: 'List all tables for an event' })
  async getEventTables(
    @Param('eventId') eventId: string,
  ): Promise<AssignTableDto[]> {
    return this.tablesService.getEventTables(eventId);
  }

  // ── Check-in ──

  @Post('events/:eventId/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check in an attendee (self QR scan, or organizer manual)',
  })
  async checkIn(
    @Param('eventId') eventId: string,
    @Body() dto: CheckInDto,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<CheckInResultDto> {
    // If a userId is supplied it's an organizer checking someone else in,
    // so that branch has to prove the caller actually is the organizer.
    const callerId = await this.resolveUserId(jwtUser);
    if (dto.userId && dto.userId !== callerId) {
      await this.tablesService.assertOrganizer(eventId, callerId);
    }
    const targetUserId = dto.userId ?? callerId;
    const method = dto.method ?? (dto.userId ? 'manual' : 'qr');
    return this.tablesService.checkIn(eventId, targetUserId, method);
  }

  @Delete('events/:eventId/check-in/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Check out an attendee' })
  async checkOut(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    // Attendees may check themselves out; anyone else has to be the organizer.
    const callerId = await this.resolveUserId(jwtUser);
    if (userId !== callerId) {
      await this.tablesService.assertOrganizer(eventId, callerId);
    }
    await this.tablesService.checkOut(eventId, userId);
  }

  @Get('events/:eventId/check-ins')
  @ApiOperation({ summary: 'List all check-ins for an event' })
  async listCheckIns(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    await this.tablesService.assertOrganizer(
      eventId,
      await this.resolveUserId(jwtUser),
    );
    return this.tablesService.listCheckIns(eventId);
  }

  // NOTE: deliberately NOT `events/:eventId/attendees` — EventsController
  // already owns that path and is registered first in AppModule, so a route
  // by that name here is unreachable.
  @Get('events/:eventId/table-attendees')
  @ApiOperation({
    summary: 'List checked-in attendees with profile details',
  })
  async getAttendees(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    await this.tablesService.assertOrganizer(
      eventId,
      await this.resolveUserId(jwtUser),
    );
    return this.tablesService.getAttendees(eventId);
  }

  // ── Assignment ──

  @Post('events/:eventId/assign-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run matching + table assignment (organizer)' })
  async assignTables(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto[]> {
    await this.tablesService.assertOrganizer(
      eventId,
      await this.resolveUserId(jwtUser),
    );
    return this.tablesService.assignTables(eventId);
  }

  @Post('events/:eventId/rotate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance to the next rotation round (organizer)' })
  async rotate(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto[]> {
    await this.tablesService.assertOrganizer(
      eventId,
      await this.resolveUserId(jwtUser),
    );
    return this.tablesService.rotate(eventId);
  }

  @Get('events/:eventId/my-assignment')
  @ApiOperation({
    summary: 'Get my table, tablemates, and conversation starters',
  })
  async getMyAssignment(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<MyAssignmentDto | null> {
    const userId = await this.resolveUserId(jwtUser);
    return this.tablesService.getMyAssignment(eventId, userId);
  }

  @Get('events/:eventId/my-table')
  @ApiOperation({ summary: 'Get current user assigned table (simple view)' })
  async getMyTable(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto | null> {
    const userId = await this.resolveUserId(jwtUser);
    return this.tablesService.getMyTable(eventId, userId);
  }
}
