import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { AddTagDto } from './dto/add-tag.dto';

@ApiTags('connections')
@Controller('connections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(
    private readonly connectionsService: ConnectionsService,
  ) {}

  private resolveUserId(jwtUser: JwtUser): string {
    return jwtUser.userId;
  }

  // ────────── REQUESTS ──────────

  @Get('requests/incoming')
  @ApiOperation({ summary: 'Get incoming pending connection requests' })
  async getIncomingRequests(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>[]> {
    const userId = await this.resolveUserId(jwtUser);
    const connections = await this.connectionsService.findIncomingRequests(userId);
    return Promise.all(
      connections.map((conn) => this.connectionsService.getEnrichedConnection(conn)),
    );
  }

  @Get('requests/outgoing')
  @ApiOperation({ summary: 'Get outgoing pending connection requests' })
  async getOutgoingRequests(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>[]> {
    const userId = await this.resolveUserId(jwtUser);
    const connections = await this.connectionsService.findOutgoingRequests(userId);
    return Promise.all(
      connections.map((conn) => this.connectionsService.getEnrichedConnection(conn)),
    );
  }

  @Get('requests/count')
  @ApiOperation({ summary: 'Count incoming pending requests' })
  async getIncomingRequestsCount(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<{ count: number }> {
    const userId = await this.resolveUserId(jwtUser);
    const count = await this.connectionsService.countIncomingRequests(userId);
    return { count };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a connection request' })
  async acceptRequest(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.acceptRequest(id, userId);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a connection request' })
  async declineRequest(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.declineRequest(id, userId);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an outgoing connection request' })
  async cancelRequest(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    const userId = await this.resolveUserId(jwtUser);
    await this.connectionsService.cancelRequest(id, userId);
  }

  // ────────── CONNECTIONS ──────────

  @Get()
  @ApiOperation({ summary: 'List all accepted connections for the current user' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in notes and tags' })
  async findAll(
    @CurrentUser() jwtUser: JwtUser,
    @Query('tag') tag?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<Record<string, any>[]> {
    const userId = await this.resolveUserId(jwtUser);
    const connections = await this.connectionsService.findAllForUser(userId, {
      tag,
      status,
      search,
    });
    return Promise.all(
      connections.map((conn) => this.connectionsService.getEnrichedConnection(conn)),
    );
  }

  @Get('favorites')
  @ApiOperation({ summary: 'List favorited connections' })
  async findFavorites(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>[]> {
    const userId = await this.resolveUserId(jwtUser);
    const connections = await this.connectionsService.findFavorites(userId);
    return Promise.all(
      connections.map((conn) => this.connectionsService.getEnrichedConnection(conn)),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a connection request' })
  async create(
    @CurrentUser() jwtUser: JwtUser,
    @Body() createConnectionDto: CreateConnectionDto,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.create(userId, createConnectionDto);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single connection by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.findById(id, userId);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a connection' })
  async update(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.update(id, userId, updateConnectionDto);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a connection' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    const userId = await this.resolveUserId(jwtUser);
    await this.connectionsService.remove(id, userId);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favorite status of a connection' })
  async toggleFavorite(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Record<string, any>> {
    const userId = await this.resolveUserId(jwtUser);
    const connection = await this.connectionsService.toggleFavorite(id, userId);
    return this.connectionsService.getEnrichedConnection(connection);
  }

  @Post('bulk-tag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a tag to multiple connections' })
  async bulkTag(
    @CurrentUser() jwtUser: JwtUser,
    @Body() body: { connectionIds: string[] } & AddTagDto,
  ): Promise<{ modifiedCount: number }> {
    if (!body.connectionIds || !Array.isArray(body.connectionIds) || body.connectionIds.length === 0) {
      throw new BadRequestException('connectionIds must be a non-empty array');
    }
    const userId = await this.resolveUserId(jwtUser);
    const modifiedCount = await this.connectionsService.bulkTag(
      body.connectionIds,
      userId,
      body.tag,
    );
    return { modifiedCount };
  }
}
