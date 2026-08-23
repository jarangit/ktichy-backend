import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';
import { RealtimeGateway } from './realtime.gateway';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Store, Station]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
    }),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
