import { Controller, Get, Param } from '@nestjs/common';
import { PublicReceiptsService } from './public-receipts.service';

@Controller('public/receipts')
export class PublicReceiptsController {
  constructor(private readonly publicReceiptsService: PublicReceiptsService) {}

  @Get(':receiptToken')
  findByToken(@Param('receiptToken') receiptToken: string) {
    return this.publicReceiptsService.findByToken(receiptToken);
  }
}
