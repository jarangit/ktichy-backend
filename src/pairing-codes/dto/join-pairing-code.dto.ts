import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinPairingCodeDto {
  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fingerprint?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
