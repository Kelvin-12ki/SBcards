import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConnectionNoteDto {
  @ApiProperty({ description: 'Private note text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}
