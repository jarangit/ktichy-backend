import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderGateway } from './order.gateway';
import { Order } from 'entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderService, OrderGateway],
  controllers: [OrderController],
})
export class OrderModule {}
