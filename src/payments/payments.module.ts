import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PromptpayQrService } from './promptpay-qr.service';
import { PromptpayQrController } from './promptpay-qr.controller';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Store } from '../stores/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, Store])],
  controllers: [PaymentsController, PromptpayQrController],
  providers: [PaymentsService, PromptpayQrService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
