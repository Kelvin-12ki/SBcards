import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { Insight } from './entities/insight.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';

@ApiTags('insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger insight generation for the current user' })
  async generate(@CurrentUser() jwtUser: JwtUser) {
    return this.insightsService.generateInsights(jwtUser.userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get insights for the current user' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by insight type' })
  async getInsights(
    @CurrentUser() jwtUser: JwtUser,
    @Query('type') type?: string,
  ): Promise<Insight[]> {
    return this.insightsService.getInsights(jwtUser.userId, type);
  }

  @Patch(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss an insight' })
  async dismissInsight(@Param('id') id: string): Promise<Insight> {
    return this.insightsService.dismissInsight(id);
  }
}
