import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeModule } from '../realtime/realtime.module';
import { ModifiersModule } from '../modifiers/modifiers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderItemModifier,
      OrderStationItem,
      Product,
    ]),
    JwtModule,
    RealtimeModule,
    ModifiersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
