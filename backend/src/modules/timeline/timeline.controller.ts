import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { TimelineService } from './timeline.service';
import { UsersService } from '../users/users.service';

@ApiTags('timeline')
@Controller('timeline')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TimelineController {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Helper to resolve the current JWT user to a MongoDB user ID.
   */
  private async resolveUserId(jwtUser: JwtUser): Promise<string> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user._id?.toString() ?? user.id;
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get the current user activity feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserFeed(
    @CurrentUser() jwtUser: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = await this.resolveUserId(jwtUser);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.timelineService.getUserFeed(userId, pageNum, limitNum);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get activity feed for an event' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEventFeed(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = await this.resolveUserId(jwtUser);

    // For now, pass just the current user as participant; in production,
    // this would query the event participation collection for all participants.
    // The eventId filter on metadata will still work to scope the feed.
    const participantIds = [userId];
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.timelineService.getEventFeed(eventId, participantIds, pageNum, limitNum);
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get activities from the current user connections' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConnectionFeed(
    @CurrentUser() jwtUser: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = await this.resolveUserId(jwtUser);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;

    // In production, connection IDs would be fetched from the connections service.
    // For now we pass an empty array — the controller calling code should inject
    // ConnectionsService and resolve connections. We document this pattern below.
    // This is a placeholder; the real integration would come when the service caller
    // provides the connectionIds.
    const connectionIds: string[] = [];
    return this.timelineService.getConnectionFeed(userId, connectionIds, pageNum, limitNum);
  }
}
