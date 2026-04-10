import {
  IsEnum,
  isEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum OrderStationItemStatusDto {
  PENDING = 'pending',
  COMPLETE = 'complete',
}
export class CreateOrderStationItemDto {
  @IsString()
  @IsNotEmpty()
  stationId: string;

  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsOptional()
  @IsEnum(OrderStationItemStatusDto)
  status: OrderStationItemStatusDto;
}
