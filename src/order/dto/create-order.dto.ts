import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus, OrderType } from 'entities/order-entity';

export class CreateOrderDto {
  @IsNotEmpty()
  orderNumber: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
