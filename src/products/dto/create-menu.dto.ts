import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  stationId: string;
}
