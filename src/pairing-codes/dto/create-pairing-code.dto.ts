import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class CreatePairingCodeDto {
  id?: string;
  storeId: number;
  code: string;
  status?: PairingCodeStatus;
  expiresAt?: Date;
  createdBy: number;
}
