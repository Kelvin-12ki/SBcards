import { PartialType } from '@nestjs/swagger';
import { CreateExhibitorDto } from './create-exhibitor.dto';

export class UpdateExhibitorDto extends PartialType(CreateExhibitorDto) {}
