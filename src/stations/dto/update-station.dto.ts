import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateStationDto } from './create-station.dto';

export class UpdateStationDto extends PartialType(CreateStationDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
