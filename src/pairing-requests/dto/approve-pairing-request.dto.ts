import { IsOptional, IsString } from 'class-validator';

export class ApprovePairingRequestDto {
  @IsOptional()
  @IsString()
  stationId?: string;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
