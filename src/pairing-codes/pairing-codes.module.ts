import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PairingCodesController } from './pairing-codes.controller';
import { PairingCodesService } from './pairing-codes.service';
import { PairingCode } from './entities/pairing-code.entity';
import { JwtModule } from '@nestjs/jwt';
import { Device } from '../devices/entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PairingCode, Device]), JwtModule],
  controllers: [PairingCodesController],
  providers: [PairingCodesService],
})
export class PairingCodesModule {}
