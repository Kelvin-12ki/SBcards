import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApplyOrganizerDto {
  @IsNotEmpty()
  @IsString()
  company!: string;

  @IsNotEmpty()
  @IsString()
  jobTitle!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}
