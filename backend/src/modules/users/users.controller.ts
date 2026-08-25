import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import {
  OrganizerRequestDto,
  ReviewOrganizerRequestDto,
} from './dto/organizer-request.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<User> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);

    if (!user) {
      return this.usersService.upsertFirebaseUser(
        jwtUser.uid,
        jwtUser.email || '',
        null,
      );
    }

    return user;
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() jwtUser: JwtUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);

    if (!user) {
      throw new Error('User not found. Please authenticate first.');
    }

    return this.usersService.update(user.id, updateUserDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name, company, skills, industry' })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query string',
    example: 'tech',
  })
  async search(@Query('q') query: string): Promise<User[]> {
    return this.usersService.search(query);
  }

  // ── Organizer requests ────────────────────────────────────────
  // NOTE: these must stay ABOVE `@Get(':userId')`. Nest matches routes in
  // declaration order, so a later `organizer-requests` would be swallowed by
  // the `:userId` wildcard and never run.

  @Post('organizer-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply to become an organizer' })
  async requestOrganizer(
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: OrganizerRequestDto,
  ): Promise<User> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.requestOrganizer(user.id, dto);
  }

  @Get('organizer-requests')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List pending organizer applications (admin)' })
  async listOrganizerRequests(): Promise<User[]> {
    return this.usersService.listOrganizerRequests();
  }

  @Patch(':id/organizer-request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Approve or reject an application (admin)' })
  async reviewOrganizerRequest(
    @Param('id') id: string,
    @Body() dto: ReviewOrganizerRequestDto,
  ): Promise<User> {
    return this.usersService.reviewOrganizerRequest(id, dto.status);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a user public profile by ID' })
  async getPublicProfile(@Param('userId') userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Post('me/fcm-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save FCM push token for notifications' })
  async saveFcmToken(
    @CurrentUser() jwtUser: JwtUser,
    @Body('token') token: string,
  ) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    await this.usersService.update(user.id, { fcmToken: token });
    return { success: true };
  }
}
