import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderGateway } from './order.gateway';
import { Order } from 'entities/order.entity';
import { Restaurant } from 'entities/restaurant.entity';
import { User } from 'entities/user.entity';
import { OrderItem } from 'entities/order-item.entity';
import { Station } from 'entities/station.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Restaurant, User, OrderItem, Station]),
  ],
  providers: [OrderService, OrderGateway],
  controllers: [OrderController],
})
export class OrderModule {}
