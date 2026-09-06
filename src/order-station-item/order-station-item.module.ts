import { Module } from '@nestjs/common';
import { OrderStationItemService } from './order-station-item.service';
import { OrderStationItemController } from './order-station-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStationItem } from './entities/order-station-item.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStationItem, Order])],
  controllers: [OrderStationItemController],
  providers: [OrderStationItemService],
})
export class OrderStationItemModule {}
