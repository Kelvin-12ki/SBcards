import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { User, UserDocument } from '../users/entities/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
      return { user: newUser, accessToken: this.authService.generateToken(newUser) };
    }

    // If DB role differs from JWT role, issue a fresh token
    const tokenRole = jwtUser.role || 'user';
    if (user.role !== tokenRole) {
      return { user, accessToken: this.authService.generateToken(user) };
    }

    return { user };
  }

  /**
   * Bootstrap: first authenticated user to call this becomes admin.
   * Only works when NO admin exists yet. Safe for production.
   */
  @Post('bootstrap-admin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'First user to call this becomes admin (only if no admin exists)' })
  async bootstrapAdmin(@CurrentUser() jwtUser: JwtUser) {
    // Check if any admin already exists
    const adminExists = await this.userModel.findOne({ role: 'admin' });
    if (adminExists) {
      return { message: 'Admin already exists', claimed: false };
    }

    // Promote this user to admin
    const user = await this.userModel.findOneAndUpdate(
      { firebaseUid: jwtUser.uid },
      { $set: { role: 'admin' } },
      { new: true },
    );

    if (!user) {
      return { message: 'User not found', claimed: false };
    }

    // Issue fresh JWT with admin role
    const accessToken = this.authService.generateToken(user as any);
    return { message: 'You are now the admin!', claimed: true, role: user.role, accessToken };
  }
}
