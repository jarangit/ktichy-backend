import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { OrderType } from '../../orders/entities/order.entity';
import { PaymentMethod } from '../../payments/entities/payment.entity';

export class GetTransactionCountsQueryDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsOptional()
  @IsEnum(['ALL', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  flowStatus?: 'ALL' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
