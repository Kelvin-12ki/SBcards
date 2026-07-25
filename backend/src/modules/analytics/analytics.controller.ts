import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':eventId/analytics')
  @ApiOperation({ summary: 'Get comprehensive event analytics' })
  async getEventAnalytics(@Param('eventId') eventId: string) {
    return this.analyticsService.getEventAnalytics(eventId);
  }
}
