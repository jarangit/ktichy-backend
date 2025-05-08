import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entiry/order.entity';
import { OrderGateway } from './order.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderService, OrderGateway],
  controllers: [OrderController],
})
export class OrderModule {}
