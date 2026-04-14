import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @IsArray()
  products: { productId: string; quantity: number }[];
}
