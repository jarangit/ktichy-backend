import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../entities/order.entity';

export class CreateOrderModifierSelectionDto {
  @IsString()
  @IsNotEmpty()
  modifierGroupId: string;

  @IsArray()
  @IsString({ each: true })
  modifierOptionIds: string[];
}

export class CreateOrderProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderModifierSelectionDto)
  modifiers?: CreateOrderModifierSelectionDto[];
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @IsEnum(OrderType)
  orderType: OrderType;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  deliveryPlatform?: string;

  @IsOptional()
  @IsString()
  deliveryOrderNumber?: string;

  @IsOptional()
  @IsBoolean()
  isWaitingInStore?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderProductDto)
  products: CreateOrderProductDto[];
}
