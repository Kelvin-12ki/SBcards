import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockDto {
  @ApiProperty({ description: 'MongoDB id of the user to block' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-fA-F]{24}$/, { message: 'userId must be a valid user id' })
  userId!: string;

  @ApiPropertyOptional({ description: 'Optional note, visible to admins only' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
