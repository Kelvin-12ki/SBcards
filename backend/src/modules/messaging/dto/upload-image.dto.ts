import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({
    description:
      'Conversation the image belongs to. Sent as a multipart text field ' +
      'alongside the file, and checked for membership before the upload.',
  })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}
