import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExhibitorDto {
  @ApiProperty({ description: 'Event ID', example: '60d5f484f1a2c8b1f8e4e1a1' })
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @ApiProperty({ description: 'Company name', example: 'TechCorp' })
  @IsNotEmpty()
  @IsString()
  companyName!: string;

  @ApiPropertyOptional({ description: 'Company description', example: 'A leading tech company.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://techcorp.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Product names', example: ['Product A', 'Product B'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @ApiPropertyOptional({ description: 'Service names', example: ['Consulting', 'Support'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ description: 'Team member user IDs', example: ['60d5f484f1a2c8b1f8e4e1a2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamMemberIds?: string[];

  @ApiPropertyOptional({ description: 'Booth number', example: 'B1' })
  @IsOptional()
  @IsString()
  boothNumber?: string;

  @ApiPropertyOptional({ description: 'Booth location', example: 'Expo Hall, Section A' })
  @IsOptional()
  @IsString()
  boothLocation?: string;
}
