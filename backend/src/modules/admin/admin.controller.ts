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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users with pagination and search' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listUsers(
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers(
      query || '',
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get full user profile with counts' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user' })
  async banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user' })
  async suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a user (set status to active)' })
  async restoreUser(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }

  @Get('events')
  @ApiOperation({ summary: 'List all events' })
  async getAllEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllEvents(
      parseInt(page || '1', 10),
      parseInt(limit || '50', 10),
    );
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an event' })
  async createEvent(
    @CurrentUser() jwtUser: JwtUser,
    @Body() data: Record<string, any>,
  ) {
    // Resolve the Firebase UID to a MongoDB user ID
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.adminService.createEvent({ ...data, creatorId: user.id });
  }

  @Patch('events/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an event' })
  async updateEvent(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.adminService.updateEvent(id, data);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event' })
  async deleteEvent(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteEvent(id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data over time' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '1y'] })
  async getAnalytics(@Query('period') period?: string) {
    return this.adminService.getAnalytics(period || '30d');
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard by metric' })
  @ApiQuery({ name: 'metric', required: false, enum: ['connections', 'cards', 'events_joined'] })
  @ApiQuery({ name: 'limit', required: false })
  async getLeaderboard(
    @Query('metric') metric?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getLeaderboard(
      metric || 'connections',
      parseInt(limit || '20', 10),
    );
  }
}
