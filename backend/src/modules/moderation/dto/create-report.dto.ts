import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { REPORT_REASONS, REPORT_TARGET_TYPES, ReportReason, ReportTargetType } from '../entities/report.entity';

/**
 * User-submitted report.
 *
 * `conversationId` is intentionally absent: the server derives the
 * conversation from the reported message so a report can never claim to
 * belong to a thread it does not.
 */
export class CreateReportDto {
  @IsIn([...REPORT_TARGET_TYPES])
  targetType!: ReportTargetType;

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsIn([...REPORT_REASONS])
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
