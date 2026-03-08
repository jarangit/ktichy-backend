import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class CreatePairingCodeDto {
  storeId?: string;
  restaurantId?: string;
  stationId?: string;
  ttlMinutes?: number;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy?: string;
}
