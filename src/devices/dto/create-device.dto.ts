import { Restaurant } from 'restaurants/entities/restaurant.entity';

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
  store: Restaurant;
}
