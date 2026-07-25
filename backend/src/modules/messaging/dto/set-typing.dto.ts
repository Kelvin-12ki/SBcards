import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetTypingDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTyping?: boolean = true;
}
