import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadQualificationDto {
  @ApiPropertyOptional({ enum: ['none', 'hot', 'warm', 'cold'] })
  @IsOptional()
  @IsEnum(['none', 'hot', 'warm', 'cold'])
  leadScore?: string;

  @ApiPropertyOptional({ enum: ['not_started', 'in_progress', 'completed', 'no_follow_up'] })
  @IsOptional()
  @IsEnum(['not_started', 'in_progress', 'completed', 'no_follow_up'])
  followUpStatus?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
