import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class UpdatePairingCodeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storeId?: string;

  @IsOptional()
  code?: string;

  @IsOptional()
  status?: PairingCodeStatus;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  createdBy?: string;
}
