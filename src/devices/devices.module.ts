import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Station, Store]), JwtModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
