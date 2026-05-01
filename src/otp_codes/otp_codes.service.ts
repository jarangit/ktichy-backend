import { Injectable } from '@nestjs/common';
import { CreateOtpCodeDto } from './dto/create-otp_code.dto';
import { UpdateOtpCodeDto } from './dto/update-otp_code.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpCode } from './entities/otp_code.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class OtpCodesService {
  constructor(
    @InjectRepository(OtpCode)
    private otpCodeRepository: Repository<OtpCode>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  create(createOtpCodeDto: CreateOtpCodeDto) {
    return 'This action adds a new otpCode';
  }

  findAll() {
    return `This action returns all otpCodes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} otpCode`;
  }

  update(id: number, updateOtpCodeDto: UpdateOtpCodeDto) {
    return `This action updates a #${id} otpCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} otpCode`;
  }

  async requestOtpCode(phoneNumber: string) {
    const normalizedPhone = this.normalizedPhone(phoneNumber);

    const existhingUser = await this.findByPhoneNumber(normalizedPhone);
    if (existhingUser) {
      throw new Error('Phone number already in use');
    }
    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);

    await this.otpCodeRepository.save({
      id: 'otp_' + Date.now(),
      phoneNumber: normalizedPhone,
      codeHash,
      purpose: 'REGISTER',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });
    // todo send otp to user via sms provider
    console.log(`OTP for ${normalizedPhone}: ${otp}`);
    return otp;
  }

  private async findByPhoneNumber(
    phoneNumber: string,
  ): Promise<OtpCode | null> {
    return this.otpCodeRepository.findOne({
      where: { phoneNumber },
    });
  }
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
  }

  private normalizedPhone(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+66' + cleaned.slice(1);
    }
    if (cleaned.startsWith('66')) {
      return '+' + cleaned;
    }
    return '+' + cleaned;
  }
  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }
}
