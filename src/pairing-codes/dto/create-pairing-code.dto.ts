import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PairingCodeStatus } from '../entities/pairing-code.entity';

export class CreatePairingCodeDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stationId?: string;

  @IsOptional()
  ttlMinutes?: number;

  @IsOptional()
  status?: PairingCodeStatus;

  @IsOptional()
  expiresAt?: Date;

  @IsOptional()
  createdBy?: string;
}
