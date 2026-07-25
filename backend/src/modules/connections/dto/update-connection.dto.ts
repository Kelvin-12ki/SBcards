import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConnectionDto {
  @ApiPropertyOptional({
    description: 'Personal notes about this connection',
    example: 'Follow up about the partnership opportunity.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing connections',
    example: ['tech', 'partnership'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Mark as favorite',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({
    description: 'Connection status',
    enum: ['pending', 'accepted', 'declined', 'archived'],
    example: 'accepted',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Date for follow-up',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: Date;

  @ApiPropertyOptional({
    description: 'Follow-up note or reminder',
    example: 'Send proposal document.',
  })
  @IsOptional()
  @IsString()
  followUpNote?: string;
}
