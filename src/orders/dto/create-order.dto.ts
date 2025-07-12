import { IsInt, IsString } from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class CreateOrderDto {
  @IsInt()
  restaurantId: number;
  @IsString()
  orderNumber: string;

  products: { productId: number; quantity: number }[];
}
