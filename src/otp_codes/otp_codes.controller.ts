import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OtpCodesService } from './otp_codes.service';
import { CreateOtpCodeDto } from './dto/create-otp_code.dto';
import { UpdateOtpCodeDto } from './dto/update-otp_code.dto';

@Controller('otp-codes')
export class OtpCodesController {
  constructor(private readonly otpCodesService: OtpCodesService) {}

  @Post()
  create(@Body() createOtpCodeDto: CreateOtpCodeDto) {
    return this.otpCodesService.create(createOtpCodeDto);
  }

  @Get()
  findAll() {
    return this.otpCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.otpCodesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOtpCodeDto: UpdateOtpCodeDto) {
    return this.otpCodesService.update(+id, updateOtpCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.otpCodesService.remove(+id);
  }
}
