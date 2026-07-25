import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTagDto {
  @ApiProperty({
    description: 'Tag to add to the connection(s)',
    example: 'tech',
  })
  @IsNotEmpty()
  @IsString()
  tag!: string;
}
