import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Filter for the device registry.
 *
 * As with auth-events every field is optional so the list always renders;
 * the reference API answered a bare 400 when a filter was absent.
 */
export class ListDevicesQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  /** Matches the device's most recent source IP. */
  @IsOptional()
  @IsString()
  ip?: string;

  /** Only devices last seen on or after this ISO-8601 timestamp. */
  @IsOptional()
  @IsISO8601()
  since?: string;

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
