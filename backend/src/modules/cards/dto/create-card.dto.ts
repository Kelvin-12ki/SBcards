import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsArray,
  IsIn,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SkillDto {
  @ApiProperty({ description: 'Skill name', example: 'TypeScript' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Skill category',
    example: 'Programming Language',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

class InterestDto {
  @ApiProperty({ description: 'Interest name', example: 'Photography' })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class CreateCardDto {
  @ApiProperty({ description: 'Full name on the card', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Professional headline',
    example: 'Full-Stack Developer',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Inc.' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Job role', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Short biography',
    example: 'Passionate developer...',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1-555-1234',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://johndoe.dev',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({
    description: 'Twitter profile URL',
    example: 'https://twitter.com/johndoe',
  })
  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @ApiPropertyOptional({
    description: 'Card template theme',
    example: 'classic',
    default: 'classic',
  })
  @IsOptional()
  @IsString()
  @IsIn(['classic', 'bold-wave', 'corporate', 'creative', 'neon'])
  theme?: string;

  @ApiPropertyOptional({
    description: 'Set as default card',
    default: false,
  })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'List of skills',
    type: [SkillDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({
    description: 'List of interests',
    type: [InterestDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestDto)
  interests?: InterestDto[];
}
