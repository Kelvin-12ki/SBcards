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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SetTypingDto } from './dto/set-typing.dto';
import { ReactionDto } from './dto/reaction.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { MessageUploadService } from './services/message-upload.service';

@ApiTags('messaging')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messageUploadService: MessageUploadService,
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
  @ApiOperation({
    summary: 'Get total unread message count across all conversations',
  })
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
  @ApiOperation({
    summary: 'Check if another user is typing in a conversation',
  })
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
  @ApiQuery({ name: 'after', required: false, type: String })
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('after') after?: string,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagingService.getMessages(
      conversationId,
      userId,
      pageNum,
      limitNum,
      after,
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
      {
        type: dto.type,
        mediaUrl: dto.mediaUrl ?? null,
        cardData: dto.cardData ?? null,
        encrypted: dto.encrypted ?? false,
      },
    );
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message (sender only)' })
  async deleteMessage(
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const userId = this.resolveUserId(jwtUser);
    await this.messagingService.deleteMessage(
      conversationId,
      messageId,
      userId,
    );
    return { success: true };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read in a conversation' })
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const count = await this.messagingService.markAsRead(
      conversationId,
      userId,
    );
    return { modifiedCount: count };
  }

  @Get(':id/messages/search')
  @ApiOperation({ summary: 'Search messages within a conversation' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchMessages(
    @Param('id') conversationId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.resolveUserId(jwtUser);
    const parsed = limit ? parseInt(limit, 10) : 50;
    const capped = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 50)
      : 50;

    const messages = await this.messagingService.searchMessages(
      conversationId,
      q ?? '',
      userId,
      capped,
    );

    return { messages, total: messages.length, query: q ?? '' };
  }

  @Post(':id/messages/:messageId/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add an emoji reaction to a message' })
  async addReaction(
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: ReactionDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    return this.messagingService.addReaction(
      conversationId,
      messageId,
      userId,
      dto.emoji,
    );
  }

  @Delete(':id/messages/:messageId/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an emoji reaction from a message' })
  async removeReaction(
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: ReactionDto,
  ) {
    const userId = this.resolveUserId(jwtUser);
    return this.messagingService.removeReaction(
      conversationId,
      messageId,
      userId,
      dto.emoji,
    );
  }

  /**
   * Upload an image for use in a chat message.
   *
   * Returns the stored URL only; the caller then sends a normal message with
   * type "image" and this mediaUrl. Membership of the target conversation is
   * checked first so the storage path cannot be used as a dumping ground for
   * a conversation the caller has nothing to do with.
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a chat image and get its URL' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MessageUploadService.maxFileSize, files: 1 },
    }),
  )
  async uploadImage(
    @CurrentUser() jwtUser: JwtUser,
    @Body() dto: UploadImageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    const userId = this.resolveUserId(jwtUser);
    await this.messagingService.assertParticipant(dto.conversationId, userId);

    return this.messageUploadService.uploadImage(dto.conversationId, file);
  }
}
