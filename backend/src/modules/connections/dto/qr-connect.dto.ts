import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QrConnectDto {
  @ApiProperty({
    description: 'ID of the user whose QR code was scanned',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsNotEmpty()
  @IsString()
  scannedUserId!: string;
}
