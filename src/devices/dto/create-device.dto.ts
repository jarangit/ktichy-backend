import { Store } from '../../entities/store.entity';

export class CreateDeviceDto {
  deviceId: string;
  deviceName?: string;
  fingerprint?: string;
  appVersion?: string;
  alias?: string;
  storeId?: string;
  restaurantId?: string;
  stationId?: string;
}
export interface CreateDeviceResponse {
  id: string;
  deviceId: string;
  deviceName?: string;
  fingerprint?: string;
  store?: Store;
}
