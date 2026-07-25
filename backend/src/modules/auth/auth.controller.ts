import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';

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
  ) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase ID token and get JWT' })
  @ApiBody({ type: VerifyTokenDto })
  async verify(
    @Body() body: VerifyTokenDto,
  ): Promise<{ accessToken: string; user: User }> {
    return this.authService.verifyFirebaseToken(body.idToken);
  }

  @Post('demo-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demo login - creates a real JWT for testing' })
  async demoLogin(): Promise<{ accessToken: string; user: User }> {
    // Find or create a demo user in the database
    const demoFirebaseUid = 'demo-uid';
    const demoEmail = 'demo@sbcards.app';

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
  ): Promise<User> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);

    if (!user) {
      // Derive a displayName from email prefix if no name from Firebase
      const emailPrefix = (jwtUser.email || '').split('@')[0] || 'User';
      const displayName = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return this.usersService.upsertFirebaseUser(
        jwtUser.uid,
        jwtUser.email || '',
        displayName,
      );
    }

    return user;
  }
}
