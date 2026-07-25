import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateReadDto {
  @ApiPropertyOptional({
    description: 'Array of message IDs to mark as read',
    example: ['60d21b4667d0d8992e610c90', '60d21b4667d0d8992e610c91'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];
}
