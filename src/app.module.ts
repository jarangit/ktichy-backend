import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { StationsModule } from './stations/stations.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrderStationItemModule } from './order-station-item/order-station-item.module';
import { DevicesModule } from './devices/devices.module';
import { PairingCodesModule } from './pairing-codes/pairing-codes.module';

const infrastructureModules = [
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true,
  }),
  ScheduleModule.forRoot(),
  SentryModule.forRoot(),
];

const featureModules = [
  UsersModule,
  StoresModule,
  StationsModule,
  ProductsModule,
  OrdersModule,
  AuthModule,
  OrderStationItemModule,
  DevicesModule,
  PairingCodesModule,
];

@Module({
  imports: [...infrastructureModules, ...featureModules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
