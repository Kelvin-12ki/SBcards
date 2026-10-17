import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query filter for the auth-events feed.
 *
 * Everything is optional on purpose: the reference API this dashboard mirrors
 * hard-requires some params and answers 400 with no body when they are missing,
 * which makes it unusable as a first screen. Defaults here give a working list.
 */
export class ListAuthEventsQueryDto {
  @IsOptional()
  @IsIn(['success', 'failure'])
  outcome?: 'success' | 'failure';

  @IsOptional()
  @IsIn([
    'login',
    'signup',
    'session_restore',
    'failed_login',
    'rate_limited',
    'account_disabled',
  ])
  eventType?: string;

  @IsOptional()
  @IsString()
  credentialType?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  /** ISO-8601 inclusive lower bound on createdAt. */
  @IsOptional()
  @IsISO8601()
  since?: string;

  /** ISO-8601 inclusive upper bound on createdAt. */
  @IsOptional()
  @IsISO8601()
  until?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number = 1;
}
