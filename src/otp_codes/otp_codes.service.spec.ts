import { Test, TestingModule } from '@nestjs/testing';
import { OtpCodesService } from './otp_codes.service';

describe('OtpCodesService', () => {
  let service: OtpCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpCodesService],
    }).compile();

    service = module.get<OtpCodesService>(OtpCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
