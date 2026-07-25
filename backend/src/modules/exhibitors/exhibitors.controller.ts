import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExhibitorsService } from './exhibitors.service';
import { CreateExhibitorDto } from './dto/create-exhibitor.dto';
import { UpdateExhibitorDto } from './dto/update-exhibitor.dto';
import { Exhibitor } from './entities/exhibitor.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('exhibitors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class ExhibitorsController {
  constructor(private readonly exhibitorsService: ExhibitorsService) {}

  @Post('events/:eventId/exhibitors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an exhibitor for an event' })
  async create(
    @Param('eventId') eventId: string,
    @Body() createExhibitorDto: CreateExhibitorDto,
  ): Promise<Exhibitor> {
    return this.exhibitorsService.create(eventId, createExhibitorDto);
  }

  @Get('events/:eventId/exhibitors')
  @ApiOperation({ summary: 'List all exhibitors for an event' })
  async findAllByEvent(
    @Param('eventId') eventId: string,
  ): Promise<Exhibitor[]> {
    return this.exhibitorsService.findAllByEvent(eventId);
  }

  @Get('exhibitors/:id')
  @ApiOperation({ summary: 'Get exhibitor details' })
  async findById(@Param('id') id: string): Promise<Exhibitor> {
    return this.exhibitorsService.findById(id);
  }

  @Patch('exhibitors/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an exhibitor' })
  async update(
    @Param('id') id: string,
    @Body() updateExhibitorDto: UpdateExhibitorDto,
  ): Promise<Exhibitor> {
    return this.exhibitorsService.update(id, updateExhibitorDto);
  }

  @Delete('exhibitors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exhibitor' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.exhibitorsService.remove(id);
  }

  @Post('exhibitors/:id/visit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a visitor to an exhibitor booth' })
  async recordVisit(@Param('id') id: string): Promise<Exhibitor> {
    return this.exhibitorsService.recordVisit(id);
  }

  @Post('exhibitors/:id/lead')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a lead for an exhibitor' })
  async recordLead(@Param('id') id: string): Promise<Exhibitor> {
    return this.exhibitorsService.recordLead(id);
  }
}
