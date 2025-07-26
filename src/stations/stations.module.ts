import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationsController } from './stations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from '../entities/station.entity';
import { JwtModule } from '@nestjs/jwt';
import { Product } from '../products/entities/product.entity';
import { OrderStationItem } from '../order-station-item/entities/order-station-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Station, Product, OrderStationItem]),
    JwtModule,
  ], // Add your entities here
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
