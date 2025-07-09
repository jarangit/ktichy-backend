import { Module } from '@nestjs/common';
import { OrderStationItemService } from './order-station-item.service';
import { OrderStationItemController } from './order-station-item.controller';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStationItem } from './entities/order-station-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStationItem])],
  controllers: [OrderStationItemController],
  providers: [OrderStationItemService],
})
export class OrderStationItemModule {}
