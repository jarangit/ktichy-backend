import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { StoreSettingsDto } from './store-settings.dto';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @IsOptional()
  @IsInt()
  @Min(1)
  orderLimit?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StoreSettingsDto)
  settings?: StoreSettingsDto;

  // PIN for write authorization — not persisted, verified per-request
  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4-6 digits' })
  pin?: string;
}
