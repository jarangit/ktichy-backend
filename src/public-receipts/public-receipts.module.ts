import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { PublicReceiptsController } from './public-receipts.controller';
import { PublicReceiptsService } from './public-receipts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PublicReceiptsController],
  providers: [PublicReceiptsService],
})
export class PublicReceiptsModule {}
