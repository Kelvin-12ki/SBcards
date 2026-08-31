import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { MatchResultDto } from './dto/match-result.dto';
import { Match } from './entities/match.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@ApiTags('matching')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly usersService: UsersService,
  ) {}

  @Post('events/:eventId/match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run matching algorithm for an event (organizer only)' })
  async runMatching(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Match[]> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.matchingService.assertOrganizer(eventId, user.id, user.role);
    return this.matchingService.runMatching(eventId);
  }

  @Get('events/:eventId/matches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user matches for an event' })
  async getMatches(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<MatchResultDto[]> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.matchingService.getMatchesForUser(eventId, user.id);
  }
}
