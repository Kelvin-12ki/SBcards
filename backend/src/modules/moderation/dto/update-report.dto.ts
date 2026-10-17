import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_STATUSES, ReportStatus } from '../entities/report.entity';

/** Disposition applied by an admin in the reports queue. */
export class UpdateReportDto {
  @IsIn([...REPORT_STATUSES])
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNote?: string;
}
