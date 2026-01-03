import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class UpdatePairingCodeDto {
  storeId?: number;
  code?: string;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy?: number;
}
