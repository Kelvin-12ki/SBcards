import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  NairobiEventsScraperService,
  NairobiEvent,
} from './nairobi-events-scraper.service';

@ApiTags('events')
@Controller('events/external')
export class ExternalEventsController {
  constructor(
    private readonly scraperService: NairobiEventsScraperService,
  ) {}

  @Get('nairobi-guide')
  @ApiOperation({
    summary: 'Fetch upcoming events from NairobiEventsGuide.com',
  })
  async getNairobiGuideEvents(): Promise<NairobiEvent[]> {
    return this.scraperService.getUpcomingEvents();
  }
}
