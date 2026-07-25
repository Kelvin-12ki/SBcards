import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session } from './entities/session.entity';
import { SessionCheckin } from './entities/session-checkin.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';

@ApiTags('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('events/:eventId/sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a session for an event' })
  async create(
    @Param('eventId') eventId: string,
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<Session> {
    return this.sessionsService.create(eventId, createSessionDto);
  }

  @Get('events/:eventId/sessions')
  @ApiOperation({ summary: 'List all sessions for an event' })
  async findAllByEvent(
    @Param('eventId') eventId: string,
  ): Promise<Session[]> {
    return this.sessionsService.findAllByEvent(eventId);
  }

  @Get('events/:eventId/schedule')
  @ApiOperation({ summary: 'Get event schedule (sessions grouped by date)' })
  async getEventSchedule(
    @Param('eventId') eventId: string,
  ): Promise<{ date: string; sessions: Session[] }[]> {
    return this.sessionsService.getEventSchedule(eventId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details' })
  async findById(@Param('id') id: string): Promise<Session> {
    return this.sessionsService.findById(id);
  }

  @Patch('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a session' })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.sessionsService.remove(id);
  }

  @Post('sessions/:id/checkin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Check into a session' })
  async checkin(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<SessionCheckin> {
    return this.sessionsService.checkin(id, jwtUser.userId);
  }

  @Get('sessions/:id/attendees')
  @ApiOperation({ summary: 'Get session attendees (checked-in users)' })
  async getAttendees(
    @Param('id') id: string,
  ): Promise<SessionCheckin[]> {
    return this.sessionsService.getAttendees(id);
  }
}
