import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { MatchResultDto } from '../matching/dto/match-result.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@ApiTags('recommendations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('events/:eventId/recommendations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-powered networking recommendations for the current user' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of recommendations to return (default 10)',
  })
  async getRecommendations(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Query('limit') limit?: number,
  ): Promise<MatchResultDto[]> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.recommendationsService.getRecommendations(
      eventId,
      user.id,
      limit,
    );
  }

  @Get('events/:eventId/recommendations/why/:targetUserId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed explanation of why two users are recommended to connect' })
  async getWhyRecommendation(
    @Param('eventId') eventId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.recommendationsService.getWhyRecommendation(
      eventId,
      user.id,
      targetUserId,
    );
  }
}
