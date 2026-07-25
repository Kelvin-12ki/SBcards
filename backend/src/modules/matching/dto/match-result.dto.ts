import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TableAssignmentDto {
  @ApiProperty({ description: 'Table ID', example: 'uuid' })
  tableId!: string;

  @ApiProperty({ description: 'Table number', example: 1 })
  tableNumber!: number;

  @ApiProperty({ description: 'Table label', example: 'Table 1' })
  label?: string;
}

class FactorScoresDto {
  @ApiProperty({ description: 'Industry match score (0-1)', example: 1 })
  industryScore!: number;

  @ApiProperty({ description: 'Skills overlap score (0-1)', example: 0.5 })
  skillsScore!: number;

  @ApiProperty({ description: 'Interests overlap score (0-1)', example: 0.3 })
  interestsScore!: number;

  @ApiProperty({ description: 'Complementarity score (0-1)', example: 0.8 })
  complementarityScore!: number;

  @ApiProperty({ description: 'Seniority compatibility score (0-1)', example: 1 })
  seniorityScore!: number;

  @ApiProperty({ description: 'Location proximity score (0-1)', example: 1 })
  locationScore!: number;
}

class MatchedUserProfileDto {
  @ApiPropertyOptional({ description: 'User display name', example: 'Jane Doe' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'User company', example: 'Acme Corp' })
  company?: string;

  @ApiPropertyOptional({ description: 'User job role', example: 'Software Engineer' })
  jobRole?: string;

  @ApiPropertyOptional({ description: 'User industry', example: 'FinTech' })
  industry?: string;

  @ApiPropertyOptional({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'User skills', example: ['TypeScript', 'React'] })
  skills?: string[];

  @ApiPropertyOptional({ description: 'User interests', example: ['Photography', 'Hiking'] })
  interests?: string[];
}

export class MatchResultDto {
  @ApiProperty({ description: 'Match ID', example: 'uuid' })
  matchId!: string;

  @ApiProperty({ description: 'Matched user ID', example: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Matched user display name', example: 'Jane Doe' })
  userName!: string;

  @ApiProperty({ description: 'Matched card ID', example: 'uuid' })
  cardId!: string;

  @ApiProperty({ description: 'Overlap score (0-1)', example: 0.75 })
  overlapScore!: number;

  @ApiProperty({
    description: 'Shared keywords',
    example: ['TypeScript', 'React', 'Photography'],
  })
  sharedKeywords!: string[];

  @ApiPropertyOptional({
    description: 'Multi-factor breakdown',
    type: FactorScoresDto,
  })
  factors?: FactorScoresDto;

  @ApiPropertyOptional({
    description: 'Human-readable explanation of why this match works',
    example: ['You both work in FinTech', 'Both skilled in TypeScript'],
  })
  explanation?: string[];

  @ApiPropertyOptional({
    description: 'Actionable conversation starters',
    example: ['Discuss your approach to TypeScript', 'Share your thoughts on AI'],
  })
  conversationStarters?: string[];

  @ApiPropertyOptional({
    description: 'Matched user profile information',
    type: MatchedUserProfileDto,
  })
  matchedUserProfile?: MatchedUserProfileDto;

  @ApiPropertyOptional({
    description: 'Table assignment if available',
    type: TableAssignmentDto,
  })
  tableAssignment?: TableAssignmentDto;
}
