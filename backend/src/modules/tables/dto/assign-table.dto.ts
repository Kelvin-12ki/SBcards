import { ApiProperty } from '@nestjs/swagger';

class AttendeeDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  userName!: string;

  @ApiProperty({ description: 'Card ID', example: 'uuid' })
  cardId!: string;
}

export class AssignTableDto {
  @ApiProperty({ description: 'Table ID', example: 'uuid' })
  tableId!: string;

  @ApiProperty({ description: 'Table number', example: 1 })
  tableNumber!: number;

  @ApiProperty({ description: 'Table label', example: 'Tech Table' })
  label?: string;

  @ApiProperty({
    description: 'Attendees assigned to this table',
    type: [AttendeeDto],
  })
  attendees!: AttendeeDto[];
}
