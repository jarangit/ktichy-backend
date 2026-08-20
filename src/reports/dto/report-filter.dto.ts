import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const PRESETS = ['today', 'week', 'month'] as const;
export type DateRangePreset = (typeof PRESETS)[number];

export class ReportFilterDto {
  @IsString()
  storeId: string;

  @Transform(({ value }) => value as DateRangePreset)
  @IsIn(PRESETS)
  preset: DateRangePreset;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}
