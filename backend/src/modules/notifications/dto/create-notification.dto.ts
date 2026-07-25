import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send the notification to',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'new_connection',
  })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Connection!',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Notification body text',
    example: 'John Doe has connected with you.',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Deep link URL',
    example: '/connections/60d21b4667d0d8992e610c85',
  })
  @IsOptional()
  @IsString()
  link?: string;
}
