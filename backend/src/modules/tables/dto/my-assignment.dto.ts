import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A person seated at the requesting user's table, with AI conversation
 * starters tailored to the pair (requester ↔ this tablemate).
 */
export class TablemateDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Display name' })
  userName!: string;

  @ApiProperty({ description: 'Card ID', example: '' })
  cardId!: string;

  @ApiProperty({ description: 'Seat number at the table', example: 3 })
  seatNumber!: number;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Job role' })
  jobRole?: string;

  @ApiPropertyOptional({ description: 'Company' })
  company?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  industry?: string;

  @ApiProperty({
    description: 'Overlap score with the requesting user (0-1)',
    example: 0.72,
  })
  overlapScore!: number;

  @ApiProperty({
    description: 'Shared keywords with the requesting user',
    type: [String],
  })
  sharedKeywords!: string[];

  @ApiProperty({
    description: 'AI conversation starters for you and this person',
    type: [String],
  })
  conversationStarters!: string[];
}

/**
 * The requesting user's current table assignment for the active rotation round.
 */
export class MyAssignmentDto {
  @ApiProperty({ description: 'Table ID' })
  tableId!: string;

  @ApiProperty({ description: 'Table number', example: 3 })
  tableNumber!: number;

  @ApiPropertyOptional({ description: 'Table label', example: 'Table 3' })
  label?: string;

  @ApiProperty({ description: 'Your seat number', example: 1 })
  seatNumber!: number;

  @ApiProperty({ description: 'Rotation round this assignment belongs to', example: 0 })
  rotationRound!: number;

  @ApiProperty({
    description: 'Other people at your table',
    type: [TablemateDto],
  })
  tablemates!: TablemateDto[];
}
