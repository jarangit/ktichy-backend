import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Store } from '../../stores/entities/store.entity';
import { DeviceStatus } from '../entities/device.entity';

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
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

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
