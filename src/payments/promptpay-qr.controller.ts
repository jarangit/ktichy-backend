import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';
import { PromptpayQrService } from './promptpay-qr.service';
import { GeneratePromptpayQrDto } from './dto/generate-promptpay-qr.dto';

@Controller('stores')
export class PromptpayQrController {
  constructor(private readonly promptpayQrService: PromptpayQrService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':storeId/promptpay-qr')
  generate(
    @Param('storeId') storeId: string,
    @Body() generatePromptpayQrDto: GeneratePromptpayQrDto,
    @Req() req: any,
  ) {
    return this.promptpayQrService.generate(
      storeId,
      generatePromptpayQrDto.amount,
      req.user?.sub,
    );
  }
}
