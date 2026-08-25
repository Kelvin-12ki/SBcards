import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** An attendee applying to become an organizer. */
export class OrganizerRequestDto {
  @ApiPropertyOptional({ description: 'Company or organization', example: 'Acme Events' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Job title', example: 'Community Lead' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    description: 'Why this person needs to run events',
    example: 'We host a monthly meetup for 120 developers.',
  })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

/** An admin approving or rejecting a standing request. */
export class ReviewOrganizerRequestDto {
  @ApiProperty({ description: 'Decision', enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}
