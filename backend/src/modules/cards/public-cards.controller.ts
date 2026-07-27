import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CardsService } from './cards.service';

@ApiTags('cards/public')
@Controller('cards/public')
export class PublicCardsController {
  private readonly logger = new Logger(PublicCardsController.name);

  constructor(private readonly cardsService: CardsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a public card by ID (no auth required)' })
  async findPublicCard(@Param('id') id: string): Promise<any> {
    const result = await this.cardsService.findPublicCard(id);
    if (!result) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }
    return result;
  }
}
