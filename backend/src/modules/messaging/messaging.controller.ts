import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SetTypingDto } from './dto/set-typing.dto';
import { UpdateReadDto } from './dto/update-read.dto';

@ApiTags('messaging')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Resolve the current JWT user to a MongoDB user ID.
   * The MongoDB user ID is stored directly in the JWT payload.
   */
  private resolveUserId(jwtUser: JwtUser): string {
    return jwtUser.userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Find or create a conversation with another user' })
  async findOrCreate(
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    return this.messagingService.findOrCreate(userId, dto.participantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all conversations for the current user' })
  async getConversations(@CurrentUser() jwtUser: JwtUser) {
    const userId = this.resolveUserId(jwtUser);
    return this.messagingService.getConversations(userId);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get total unread message count across all conversations' })
  async getUnreadCount(@CurrentUser() jwtUser: JwtUser) {
    const userId = this.resolveUserId(jwtUser);
    const count = await this.messagingService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/typing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set or clear typing indicator in a conversation' })
  async setTyping(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: SetTypingDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    if (dto.isTyping) {
      await this.messagingService.setTyping(conversationId, userId);
    } else {
      this.messagingService.clearTyping(conversationId, userId);
    }
    return { success: true };
  }

  @Get(':id/typing')
  @ApiOperation({ summary: 'Check if another user is typing in a conversation' })
  async getTyping(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const typingUsers = await this.messagingService.getTypingUsers(
      conversationId,
      userId,
    );
    return { typing: typingUsers.length > 0 };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagingService.getMessages(
      conversationId,
      userId,
      pageNum,
      limitNum,
    );
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: SendMessageDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    return this.messagingService.sendMessage(
      conversationId,
      userId,
      dto.content,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read in a conversation' })
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() _dto: UpdateReadDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const count = await this.messagingService.markAsRead(
      conversationId,
      userId,
    );
    return { modifiedCount: count };
  }
}
