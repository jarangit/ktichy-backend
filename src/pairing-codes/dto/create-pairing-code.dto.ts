import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class CreatePairingCodeDto {
  storeId: number;
  stationId: number;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy?: string;
}
  