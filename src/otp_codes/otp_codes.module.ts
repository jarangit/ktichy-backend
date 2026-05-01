import { Module } from '@nestjs/common';
import { OtpCodesService } from './otp_codes.service';
import { OtpCodesController } from './otp_codes.controller';

@Module({
  controllers: [OtpCodesController],
  providers: [OtpCodesService],
})
export class OtpCodesModule {}
