import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Global search across all entities' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  async globalSearch(
    @Query('q') query: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    return this.searchService.globalSearch(query, jwtUser.userId);
  }

  @Get('people')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search people with optional filters' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'industry', required: false })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'company', required: false })
  @ApiQuery({ name: 'seniority', required: false })
  async searchPeople(
    @Query('q') query: string,
    @Query('industry') industry?: string,
    @Query('skills') skills?: string,
    @Query('company') company?: string,
    @Query('seniority') seniority?: string,
  ) {
    return this.searchService.searchPeople(query, {
      industry,
      skills,
      company,
      seniority,
    });
  }

  @Get('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search events with optional filters' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'tags', required: false })
  async searchEvents(
    @Query('q') query: string,
    @Query('date') date?: string,
    @Query('location') location?: string,
    @Query('tags') tags?: string,
  ) {
    return this.searchService.searchEvents(query, { date, location, tags });
  }

  @Get('companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search companies across users and exhibitors' })
  @ApiQuery({ name: 'q', required: true })
  async searchCompanies(
    @Query('q') query: string,
  ) {
    return this.searchService.searchCompanies(query);
  }
}
