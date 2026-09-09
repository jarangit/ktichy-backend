import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

// FE sometimes sends "" or null for untouched money inputs.
// Normalize those to undefined so @IsOptional() skips validation;
// genuinely non-numeric strings (e.g. "1,200") still fail @IsNumber().
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreatePaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  // Transitional: FE may still send amount, but BE only uses it as a
  // validation check against the computed order total. The stored
  // Payment.amount is always the backend-computed total.
  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsNumber()
  receivedAmount?: number;
}
