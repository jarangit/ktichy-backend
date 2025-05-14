import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderType } from 'src/entiry/order.entity';
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}
export class CreateOrderDto {
  @IsNotEmpty()
  orderNumber: string;

  @IsEnum(OrderType)
  type: OrderType;
}
