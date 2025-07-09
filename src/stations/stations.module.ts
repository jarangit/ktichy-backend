import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationsController } from './stations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from '../entities/station.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Station]), JwtModule], // Add your entities here
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
