import { PartialType } from '@nestjs/mapped-types';
import { CreateOtpCodeDto } from './create-otp_code.dto';

export class UpdateOtpCodeDto extends PartialType(CreateOtpCodeDto) {}
