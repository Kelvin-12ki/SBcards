import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Check an attendee in to an event.
 * - Self check-in (QR at the door): omit `userId`, the caller is checked in.
 * - Organizer manual check-in: pass the attendee's `userId`.
 */
export class CheckInDto {
  @ApiPropertyOptional({
    description:
      'User to check in. Omit to check in the authenticated caller (self check-in).',
    example: 'user-mongo-id',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'How the check-in happened',
    enum: ['qr', 'manual', 'self'],
    example: 'qr',
  })
  @IsOptional()
  @IsIn(['qr', 'manual', 'self'])
  method?: string;
}

export class CheckInResultDto {
  @ApiProperty({ description: 'Check-in record ID' })
  id!: string;

  @ApiProperty({ description: 'Event ID' })
  eventId!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Check-in timestamp' })
  checkedInAt!: Date;

  @ApiProperty({ description: 'Check-in method' })
  method!: string;

  @ApiProperty({
    description: 'Whether the user has a card / event participation yet',
  })
  hasCard!: boolean;
}
