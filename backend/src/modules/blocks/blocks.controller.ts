import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiOperation({
    summary: 'Block a user',
    description:
      'Suppresses messaging and connection requests in both directions.',
  })
  create(@CurrentUser() jwtUser: JwtUser, @Body() dto: CreateBlockDto) {
    return this.blocksService.block(jwtUser.userId, dto.userId, dto.reason);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock a previously blocked user' })
  unblock(
    @CurrentUser() jwtUser: JwtUser,
    @Param('userId') userId: string,
  ): Promise<{ ok: true }> {
    return this.blocksService
      .unblock(jwtUser.userId, userId)
      .then(() => ({ ok: true as const }));
  }

  @Get()
  @ApiOperation({ summary: 'Users the caller has blocked' })
  list(@CurrentUser() jwtUser: JwtUser) {
    return this.blocksService.listMine(jwtUser.userId);
  }

  @Get('status/:userId')
  @ApiOperation({
    summary: 'Block relationship between the caller and another user',
    description: 'Never reveals whether the other user blocked the caller beyond a boolean.',
  })
  async status(
    @CurrentUser() jwtUser: JwtUser,
    @Param('userId') userId: string,
  ): Promise<{ blockedByMe: boolean; blockedMe: boolean }> {
    const direction = await this.blocksService.findBetween(jwtUser.userId, userId);
    return {
      blockedByMe: direction === 'outgoing',
      blockedMe: direction === 'incoming',
    };
  }
}
