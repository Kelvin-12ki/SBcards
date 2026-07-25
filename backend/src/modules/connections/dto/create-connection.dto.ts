import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConnectionDto {
  @ApiProperty({
    description: 'ID of the user to connect with',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsString()
  connectedUserId!: string;

  @ApiPropertyOptional({
    description: 'ID of the card that was shared during the connection',
    example: '60d21b4667d0d8992e610c86',
  })
  @IsOptional()
  @IsString()
  connectedCardId?: string;

  @ApiPropertyOptional({
    description: 'Event ID where the connection was made',
    example: '60d21b4667d0d8992e610c87',
  })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Source of the connection',
    example: 'manual',
    default: 'qr_scan',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Personal notes about this connection',
    example: 'Met at the networking breakfast.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
