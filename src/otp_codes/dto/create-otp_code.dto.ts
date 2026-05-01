export class CreateOtpCodeDto {
  phoneNumber: string;
}

export class VerifyOtpCodeDto {
  phoneNumber: string;
  code: string;
  username: string;
}
