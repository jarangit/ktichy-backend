import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PairingRequestsController } from './pairing-requests.controller';
import { PairingRequestsService } from './pairing-requests.service';
import { PairingRequest } from './entities/pairing-request.entity';
import { Device } from '../devices/entities/device.entity';
import { Station } from '../stations/entities/station.entity';
import { PairingCode } from '../pairing-codes/entities/pairing-code.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([PairingRequest, Device, Station, PairingCode]),
    JwtModule,
  ],
  controllers: [PairingRequestsController],
  providers: [PairingRequestsService],
})
export class PairingRequestsModule {}
