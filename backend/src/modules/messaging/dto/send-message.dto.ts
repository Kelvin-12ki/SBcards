import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  ValidateIf,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MESSAGE_TYPES, MessageType } from '../entities/message.entity';

/**
 * Snapshot of the shared card. Declared as a class (rather than a loose
 * object) so the global ValidationPipe's `whitelist` recurses into it —
 * an untyped object would have its properties stripped.
 */
export class SharedCardDataDto {
  @ApiProperty({ description: 'Id of the card being shared' })
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @ApiProperty({ description: 'Display name on the card' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content. Required for text messages.',
    example: 'Hello! Would you like to connect?',
  })
  // Images and shared cards may carry an empty body or an optional caption,
  // so the non-empty requirement applies to text messages only.
  @ValidateIf((o: SendMessageDto) => (o.type ?? 'text') === 'text')
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({ enum: MESSAGE_TYPES, default: 'text' })
  @IsOptional()
  @IsEnum(MESSAGE_TYPES)
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Storage URL for an image message' })
  @ValidateIf(
    (o: SendMessageDto) => o.mediaUrl !== undefined && o.mediaUrl !== null,
  )
  @IsUrl({ require_protocol: true })
  mediaUrl?: string;

  @ApiPropertyOptional({ type: SharedCardDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SharedCardDataDto)
  cardData?: SharedCardDataDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;
}
