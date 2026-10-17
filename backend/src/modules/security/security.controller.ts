import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ListAuthEventsQueryDto } from './dto/list-auth-events.query';
import { ListDevicesQueryDto } from './dto/list-devices.query';
import { SecurityService } from './security.service';

@ApiTags('admin-security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('auth-events/stats')
  @ApiOperation({ summary: 'Auth event aggregates for the security overview' })
  getAuthEventStats() {
    return this.securityService.authEventStats();
  }

  @Get('auth-events')
  @ApiOperation({
    summary: 'Paginated authentication events with filters',
    description:
      'Every login, signup, session restore, failure and rate-limit denial ' +
      'that reached the API. All filters are optional.',
  })
  listAuthEvents(@Query() query: ListAuthEventsQueryDto) {
    return this.securityService.listAuthEvents(query);
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Registered user devices',
    description:
      'One row per (user, device), created the first time that user ' +
      'authenticates from the device. All filters are optional.',
  })
  listDevices(@Query() query: ListDevicesQueryDto) {
    return this.securityService.listDevices(query);
  }
}
