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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
