import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  IsInt,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Only the pre-live states may be set directly. `active` / `completed` /
 * `cancelled` are reached through the activate / complete / cancel
 * endpoints so `isActive` stays in sync with `status`.
 */
export const PRE_LIVE_STATUSES = ['upcoming', 'draft'] as const;

export class CreateEventDto {
  @ApiProperty({ description: 'Event name', example: 'Tech Networking Night' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'A networking event for tech professionals.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Event location',
    example: '123 Main St, San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2025-01-15T18:00:00Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  startDate!: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2025-01-15T21:00:00Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  endDate!: string;

  @ApiPropertyOptional({
    description:
      'Initial status. Only pre-live values; use activate/complete/cancel for the rest.',
    enum: PRE_LIVE_STATUSES,
    default: 'upcoming',
  })
  @IsOptional()
  @IsIn(PRE_LIVE_STATUSES)
  status?: (typeof PRE_LIVE_STATUSES)[number];

  @ApiPropertyOptional({
    description: 'Maximum number of attendees',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxAttendees?: number;

  @ApiPropertyOptional({
    description: 'Number of tables',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tableCount?: number;

  @ApiPropertyOptional({
    description: 'Capacity per table',
    example: 6,
    default: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tableCapacity?: number;
}
