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
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { Card } from './entities/card.entity';
import { UsersService } from '../users/users.service';

@ApiTags('cards')
@Controller('cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all cards for the current user' })
  async findAll(@CurrentUser() jwtUser: JwtUser): Promise<Card[]> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      return [];
    }
    return this.cardsService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new digital business card' })
  async create(
    @CurrentUser() jwtUser: JwtUser,
    @Body() createCardDto: CreateCardDto,
  ): Promise<Card> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.cardsService.create(user.id, createCardDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all public cards for a user' })
  async findByUserId(@Param('userId') userId: string): Promise<Card[]> {
    return this.cardsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a card by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Card> {
    const card = await this.cardsService.findById(id);
    if (!card) {
      throw new Error(`Card with ID "${id}" not found`);
    }
    return card;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a card' })
  async update(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
    @Body() updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.cardsService.update(id, user.id, updateCardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a card' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<void> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    await this.cardsService.delete(id, user.id);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a card as the default' })
  async setDefault(
    @Param('id') id: string,
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<Card> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new Error('User not found');
    }
    return this.cardsService.setDefault(id, user.id);
  }
}
