import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateStorePinDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4-6 digits' })
  pin: string;
}
