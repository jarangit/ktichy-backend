import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCodesService } from './otp_codes.service';
import { OtpCodesController } from './otp_codes.controller';
import { OtpCode } from './entities/otp_code.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode, User])],
  controllers: [OtpCodesController],
  providers: [OtpCodesService],
})
export class OtpCodesModule {}
