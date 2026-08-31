import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { Event } from './entities/event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { UsersService } from '../users/users.service';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all events' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['upcoming', 'active', 'completed'],
  })
  async findAll(
    @Query('status') status?: 'upcoming' | 'active' | 'completed',
  ): Promise<Event[]> {
    return this.eventsService.findAll(status);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event' })
  async create(
    @CurrentUser() jwtUser: JwtUser,
    @Body() createEventDto: CreateEventDto,
  ): Promise<Event> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    // Role is read from the database, not the JWT, so a promotion takes effect
    // without the user signing out and back in. 'user' is the legacy value for
    // accounts predating roles and is treated as an attendee.
    if (user.role !== 'organizer' && user.role !== 'admin') {
      throw new ForbiddenException('Organizer role required to create events');
    }
    return this.eventsService.create(user.id, createEventDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  async findById(@Param('id') id: string): Promise<Event | null> {
    return this.eventsService.findById(id);
  }

  @Get(':id/my-status')
  @ApiOperation({
    summary: "Current user's join / check-in / seating state for an event",
  })
  async getMyEventStatus(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.eventsService.getMyEventStatus(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an event (creator only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.eventsService.update(id, user.id, updateEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (creator only)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    await this.eventsService.delete(id, user.id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join an event' })
  async join(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() joinEventDto: JoinEventDto,
  ): Promise<EventParticipation> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.eventsService.join(id, user.id, joinEventDto.cardId);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave an event' })
  async leave(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    await this.eventsService.leave(id, user.id);
  }

  @Patch(':id/visibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle participation visibility' })
  async toggleVisibility(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<EventParticipation> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.eventsService.toggleVisibility(id, user.id);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'List participants with details (creator only)' })
  async getParticipants(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.eventsService.getParticipantsWithDetails(id, user.id);
  }

  @Get(':id/attendees')
  @ApiOperation({ summary: 'List visible attendees' })
  async getAttendees(
    @Param('id') id: string,
  ): Promise<EventParticipation[]> {
    return this.eventsService.getAttendees(id);
  }

  @Get(':id/participation')
  @ApiOperation({ summary: 'Check if current user is participating' })
  async checkParticipation(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<EventParticipation | null> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      return null;
    }
    return this.eventsService.checkParticipation(id, user.id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an event (triggers matching & tables)' })
  async activate(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Event> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.eventsService.activate(id);
  }
}
