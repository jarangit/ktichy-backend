import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Parses a query-string boolean (`true`/`false`/`1`/`0`, case-insensitive).
 * Returns the raw value when unparseable so `@IsBoolean()` rejects it
 * with a 400 instead of silently ignoring the filter.
 */
function parseQueryBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return value;
}

export class GetProductsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseQueryBoolean(value))
  @IsBoolean()
  isBestSeller?: boolean;
}
