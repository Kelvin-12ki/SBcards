import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HeatmapService } from './heatmap.service';
import { HeatmapData } from './entities/heatmap-data.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('heatmap')
@Controller('events/:eventId/heatmap')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HeatmapController {
  constructor(private readonly heatmapService: HeatmapService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full heatmap data for an event' })
  async getHeatmap(@Param('eventId') eventId: string): Promise<HeatmapData[]> {
    return this.heatmapService.getHeatmap(eventId);
  }

  @Get('peak')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get peak activity times for an event' })
  async getPeakTimes(@Param('eventId') eventId: string) {
    return this.heatmapService.getPeakTimes(eventId);
  }

  @Get('locations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get location density for an event' })
  async getLocationDensity(@Param('eventId') eventId: string) {
    return this.heatmapService.getLocationDensity(eventId);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate heatmap from historical data' })
  async generateFromHistory(@Param('eventId') eventId: string) {
    return this.heatmapService.generateHeatmapFromHistory(eventId);
  }
}
