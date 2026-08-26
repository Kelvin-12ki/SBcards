import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReactionDto {
  @ApiProperty({ description: 'The emoji to react with', example: '👍' })
  @IsString()
  @IsNotEmpty()
  // Reactions are stored as object keys, so the value ends up inside a Mongo
  // update path. Dots and dollars would change how that path is interpreted,
  // and an over-long value would let a client bloat the document.
  @MaxLength(16)
  @Matches(/^[^.$\s]+$/, {
    message: 'emoji must not contain dots, dollar signs, or whitespace',
  })
  emoji!: string;
}
