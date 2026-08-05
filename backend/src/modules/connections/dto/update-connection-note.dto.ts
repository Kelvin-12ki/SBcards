import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConnectionNoteDto {
  @ApiProperty({ description: 'Updated note text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}
