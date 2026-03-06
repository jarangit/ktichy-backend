import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class CreatePairingCodeDto {
  storeId: string;
  stationId: string;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy?: string;
}
  
