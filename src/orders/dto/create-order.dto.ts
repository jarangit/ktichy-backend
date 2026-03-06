import { IsInt, IsOptional, IsString } from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class CreateOrderDto {
  @IsOptional()
  @IsInt()
  restaurantId?: number;

  @IsOptional()
  @IsInt()
  storeId?: number;

  @IsString()
  orderNumber: string;

  products: { productId: number; quantity: number }[];
}
