import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateStorePinDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'currentPin must be 4-6 digits' })
  currentPin: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'newPin must be 4-6 digits' })
  newPin: string;
}
