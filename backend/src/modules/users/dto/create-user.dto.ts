import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SocialLinkDto {
  @ApiPropertyOptional({ description: 'Social link label', example: 'LinkedIn' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Social link URL', example: 'https://linkedin.com/in/johndoe' })
  @IsOptional()
  @IsString()
  url?: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Firebase UID',
    example: 'abc123def456',
  })
  @IsNotEmpty()
  @IsString()
  firebaseUid!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Professional title',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Industry',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'TechCorp',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    description: 'Job role',
    example: 'Full Stack Developer',
  })
  @IsOptional()
  @IsString()
  jobRole?: string;

  @ApiPropertyOptional({
    description: 'Seniority level',
    enum: ['entry', 'mid', 'senior', 'executive'],
    example: 'senior',
  })
  @IsOptional()
  @IsEnum(['entry', 'mid', 'senior', 'executive'])
  seniority?: string;

  @ApiPropertyOptional({
    description: 'What the user is looking for',
    example: ['investors', 'partners', 'clients', 'talent'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lookingFor?: string[];

  @ApiPropertyOptional({
    description: 'What the user is offering',
    example: ['consulting', 'funding', 'mentorship'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offering?: string[];

  @ApiPropertyOptional({
    description: 'Skills',
    example: ['JavaScript', 'TypeScript', 'Node.js'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Interests',
    example: ['AI', 'Blockchain', 'Startups'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({
    description: 'Short bio',
    example: 'Passionate about building great products.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Portfolio URL',
    example: 'https://johndoe.dev',
  })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional({
    description: 'Social links',
    type: [SocialLinkDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @ApiPropertyOptional({
    description: 'Location',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/Los_Angeles',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Profile completion flag',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  profileComplete?: boolean;

  @ApiPropertyOptional({
    description: 'FCM push token for notifications',
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
