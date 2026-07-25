import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  IsArray,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'Event ID', example: '60d5f484f1a2c8b1f8e4e1a1' })
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @ApiProperty({ description: 'Session title', example: 'Intro to AI Networking' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Session description', example: 'A workshop on AI networking strategies.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '2025-01-15T09:00:00Z' })
  @IsNotEmpty()
  @IsISO8601()
  startTime!: string;

  @ApiProperty({ description: 'End time (ISO 8601)', example: '2025-01-15T10:00:00Z' })
  @IsNotEmpty()
  @IsISO8601()
  endTime!: string;

  @ApiPropertyOptional({ description: 'Location', example: 'Main Hall' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Room', example: 'Room A' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ description: 'Speaker user IDs', example: ['60d5f484f1a2c8b1f8e4e1a2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  speakerIds?: string[];

  @ApiPropertyOptional({
    description: 'Session type',
    enum: ['talk', 'workshop', 'panel', 'break', 'networking'],
    example: 'workshop',
  })
  @IsOptional()
  @IsEnum(['talk', 'workshop', 'panel', 'break', 'networking'])
  type?: string;

  @ApiPropertyOptional({ description: 'Maximum capacity', example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Tags', example: ['ai', 'networking'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
