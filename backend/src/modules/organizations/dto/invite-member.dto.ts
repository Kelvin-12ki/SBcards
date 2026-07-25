import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/interfaces/role.interface';

export class InviteMemberDto {
  @ApiProperty({
    description: 'User ID to invite',
    example: '64a1b2c3d4e5f6a7b8c9d0e1',
  })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Role to assign',
    enum: Role,
    example: Role.ATTENDEE,
  })
  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;
}
