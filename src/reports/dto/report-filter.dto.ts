import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReportPreset {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

export class ReportFilterDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsEnum(ReportPreset)
  preset: ReportPreset;

  @IsOptional()
  @IsString()
  month?: string;
}
