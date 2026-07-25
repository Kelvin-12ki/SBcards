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
import { TablesService } from './tables.service';
import { AssignTableDto } from './dto/assign-table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';

@ApiTags('tables')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('events/:eventId/tables')
  @ApiOperation({ summary: 'List all tables for an event' })
  async getEventTables(
    @Param('eventId') eventId: string,
  ): Promise<AssignTableDto[]> {
    return this.tablesService.getEventTables(eventId);
  }

  @Post('events/:eventId/assign-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run table assignment algorithm (organizer only)' })
  async assignTables(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto[]> {
    // Organizer check would be done here in production
    return this.tablesService.assignTables(eventId);
  }

  @Get('events/:eventId/my-table')
  @ApiOperation({ summary: 'Get current user assigned table' })
  async getMyTable(
    @Param('eventId') eventId: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<AssignTableDto | null> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.tablesService.getMyTable(eventId, user.id);
  }
}
