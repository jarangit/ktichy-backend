import { IsOptional, IsString } from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  orderNumber: string;

  products: { productId: string; quantity: number }[];
}
