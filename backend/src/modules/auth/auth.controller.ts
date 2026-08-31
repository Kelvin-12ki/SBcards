import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApplyOrganizerDto } from './dto/apply-organizer.dto';

class VerifyTokenDto {
  @IsNotEmpty()
  @IsString()
  idToken!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify Firebase ID token and get JWT' })
  @ApiBody({ type: VerifyTokenDto })
  async verify(
    @Body() body: VerifyTokenDto,
  ): Promise<{ accessToken: string; user: User }> {
    return this.authService.verifyFirebaseToken(body.idToken);
  }

  /**
   * Local development convenience only.
   *
   * This mints a real, fully-privileged JWT with no credential of any kind, so
   * it is hard-disabled outside development — reachable in production it is a
   * complete authentication bypass for anyone who knows the path.
   */
  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: '[dev only] Demo login - creates a real JWT for testing',
  })
  async demoLogin(): Promise<{ accessToken: string; user: User }> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException();
    }

    // Find or create a demo user in the database
    const demoFirebaseUid = 'demo-uid';
    const demoEmail = 'demo@nexas.app';

    let user = await this.usersService.findByFirebaseUid(demoFirebaseUid);

    if (!user) {
      user = await this.usersService.upsertFirebaseUser(
        demoFirebaseUid,
        demoEmail,
        'Demo User',
      );
    }

    // Generate a real JWT token
    const accessToken = this.authService.generateToken(user);

    return { accessToken, user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<{ user: User; accessToken?: string }> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);

    if (!user) {
      // Derive a displayName from email prefix if no name from Firebase
      const emailPrefix = (jwtUser.email || '').split('@')[0] || 'User';
      const displayName = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const newUser = await this.usersService.upsertFirebaseUser(
        jwtUser.uid,
        jwtUser.email || '',
        displayName,
      );
      return {
        user: newUser,
        accessToken: this.authService.generateToken(newUser),
      };
    }

    // If DB role differs from JWT role, issue a fresh token
    const tokenRole = jwtUser.role || 'user';
    if (user.role !== tokenRole) {
      return { user, accessToken: this.authService.generateToken(user) };
    }

    return { user };
  }

  @Post('apply-organizer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply for organizer role' })
  @ApiBody({ type: ApplyOrganizerDto })
  async applyForOrganizer(
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: ApplyOrganizerDto,
  ) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.authService.applyForOrganizer(user.id, dto);
  }

  @Get('organizer-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user organizer application status' })
  async getOrganizerStatus(@CurrentUser() jwtUser: JwtUser) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.authService.getOrganizerStatus(user.id);
  }
}
