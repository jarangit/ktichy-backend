import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Store } from '../../stores/entities/store.entity';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stationId?: string;
}
export interface CreateDeviceResponse {
  id: string;
  deviceId: string;
  deviceName?: string;
  fingerprint?: string;
  store?: Store;
}
