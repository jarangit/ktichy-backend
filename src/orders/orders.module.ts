import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from 'order-station-item/entities/order-station-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStationItem, Product])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
