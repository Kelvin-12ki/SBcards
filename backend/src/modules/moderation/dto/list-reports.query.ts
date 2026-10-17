import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { REPORT_STATUSES, REPORT_TARGET_TYPES, ReportStatus, ReportTargetType } from '../entities/report.entity';

/** Filter for the admin reports queue. Every field is optional. */
export class ListReportsQueryDto {
  @IsOptional()
  @IsIn([...REPORT_STATUSES])
  status?: ReportStatus;

  @IsOptional()
  @IsIn([...REPORT_TARGET_TYPES])
  type?: ReportTargetType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number = 1;
}
