import { Store } from '../../stores/entities/store.entity';

export class CreateDeviceDto {
  deviceId: string;
  deviceName?: string;
  fingerprint?: string;
  appVersion?: string;
  alias?: string;
  storeId?: string;
  stationId?: string;
}
export interface CreateDeviceResponse {
  id: string;
  deviceId: string;
  deviceName?: string;
  fingerprint?: string;
  store?: Store;
}
