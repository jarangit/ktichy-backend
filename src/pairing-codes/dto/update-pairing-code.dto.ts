import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class UpdatePairingCodeDto {
  storeId?: string;
  code?: string;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy?: string;
}
