import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello! Would you like to connect?',
  })
  @IsNotEmpty()
  @IsString()
  content!: string;
}
