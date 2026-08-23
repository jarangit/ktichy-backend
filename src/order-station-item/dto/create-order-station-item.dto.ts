import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OrderStationItemStatusDto {
  PENDING = 'pending',
  COMPLETE = 'complete',
  SERVED = 'served',
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
