import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePromptpayQrDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}
