import { Store } from '../../stores/entities/store.entity';

export class CreateDeviceDto {
  deviceName: string;
  fingerprint: string;
  storeId: string;
  stationId: string;
}
export interface CreateDeviceResponse {
  id: string;
  deviceName: string;
  fingerprint: string;
  store: Store;
}
