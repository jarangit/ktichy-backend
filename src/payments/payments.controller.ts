import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('orders')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.pay(id, createPaymentDto);
  }
}
