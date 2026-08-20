import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SalesSettingsDto {
  @IsOptional()
  @IsBoolean()
  useTable?: boolean;

  @IsOptional()
  @IsBoolean()
  useQueue?: boolean;

  @IsOptional()
  @IsBoolean()
  useNote?: boolean;

  @IsOptional()
  @IsBoolean()
  useOptions?: boolean;

  @IsOptional()
  @IsIn(['dineIn', 'togo'])
  defaultType?: 'dineIn' | 'togo';
}

export class PaymentsSettingsDto {
  @IsOptional()
  @IsBoolean()
  cash?: boolean;

  @IsOptional()
  @IsBoolean()
  qr?: boolean;

  @IsOptional()
  @IsBoolean()
  bank?: boolean;

  @IsOptional()
  @IsBoolean()
  truemoney?: boolean;
}

export class SafetySettingsDto {
  @IsOptional()
  @IsBoolean()
  confirmDelete?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmRefund?: boolean;
}

export class DeliverySettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedPlatforms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledPlatforms?: string[];
}

export class StoreSettingsDto {
  @IsOptional()
  @IsString()
  hours?: string;

  @IsOptional()
  @IsString()
  promptpay?: string;

  @IsOptional()
  @IsString()
  dailyRevenueTarget?: string;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalesSettingsDto)
  sales?: SalesSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentsSettingsDto)
  payments?: PaymentsSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SafetySettingsDto)
  safety?: SafetySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliverySettingsDto)
  delivery?: DeliverySettingsDto;
}
