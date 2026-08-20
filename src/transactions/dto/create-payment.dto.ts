import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TransactionMethod } from '../entities/transaction.entity';

export class CreatePaymentDto {
  @IsEnum(TransactionMethod)
  method: TransactionMethod;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;
}
