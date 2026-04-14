import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
