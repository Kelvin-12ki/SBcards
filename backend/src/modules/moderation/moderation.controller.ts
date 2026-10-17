import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query';

/**
 * User reporting and admin moderation.
 *
 * The two halves live in one controller because they share a resource, but
 * every admin route re-applies both guards: being able to file a report must
 * never imply being able to read the queue, and the message-context route in
 * particular is the API's only cross-conversation read.
 */
@ApiTags('moderation')
@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a message, user or conversation' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(user.userId, dto);
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reports (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  list(@Query() query: ListReportsQueryDto) {
    return this.moderationService.listReports(query);
  }

  @Patch('admin/reports/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disposition a report (admin)' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.moderationService.updateReport(user.userId, id, dto);
  }

  @Get('admin/reports/:id/messages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Read message context for a reported message (admin, audited)',
  })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'limit', required: false })
  readMessages(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = parseInt(limit || '', 10);
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
    return this.moderationService.readReportMessages(
      user.userId,
      id,
      before,
      safeLimit,
    );
  }

  @Get('admin/chats/overview')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chat volume, top senders and busiest threads (admin)' })
  @ApiQuery({ name: 'days', required: false })
  overview(@Query('days') days?: string) {
    const parsed = parseInt(days || '', 10);
    return this.moderationService.chatsOverview(
      Number.isFinite(parsed) ? parsed : 30,
    );
  }
}
