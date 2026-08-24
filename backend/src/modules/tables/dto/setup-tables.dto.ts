import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Organizer configures the physical table layout for an event.
 * Generates `tableCount` tables each with `seatsPerTable` seats.
 */
export class SetupTablesDto {
  @ApiProperty({ description: 'Number of tables', example: 6 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  tableCount!: number;

  @ApiProperty({ description: 'Seats per table', example: 6 })
  @IsInt()
  @Min(2)
  @Max(20)
  @Type(() => Number)
  seatsPerTable!: number;

  @ApiPropertyOptional({
    description: 'Minutes between automatic rotations (optional)',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  rotationIntervalMinutes?: number;
}
